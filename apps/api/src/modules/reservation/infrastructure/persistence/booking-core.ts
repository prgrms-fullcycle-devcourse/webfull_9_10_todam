import { HttpStatus } from '@nestjs/common';
import { Prisma, StoreTimeSlotStatus } from '@prisma/client';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { toKstWallClock } from '../../../../common/date/kst-date.util';
import { TimeSlotGenerationService } from '../../../timeslot/domain/services/time-slot-generation.service';
import { tryIncrementReservedCount } from './reservation-slot-count';

export interface MaterializeBookingSlotInput {
    storeId: string;
    programId: string;
    participantCount: number;
    slotId?: string;
    startAt?: string;
    expectedEndAt?: string;
    allowPast: boolean;
}

export interface MaterializedBookingSlot {
    id: string;
    startAt: Date;
    endAt: Date;
}

export async function lockStore(tx: Prisma.TransactionClient, storeId: string): Promise<void> {
    await tx.$queryRaw`
        SELECT "id" FROM "stores" WHERE "id" = ${storeId}::uuid FOR UPDATE
    `;
}

export async function materializeBookingSlot(
    tx: Prisma.TransactionClient,
    input: MaterializeBookingSlotInput,
): Promise<MaterializedBookingSlot> {
    await lockStore(tx, input.storeId);

    const store = await tx.store.findUnique({
        where: { id: input.storeId },
        select: {
            reservationIntervalMinutes: true,
            maxCapacityPerSlot: true,
            operatingHours: {
                select: {
                    dayOfWeek: true,
                    openTime: true,
                    closeTime: true,
                    breakStart: true,
                    breakEnd: true,
                },
            },
        },
    });
    if (!store?.reservationIntervalMinutes) {
        throw new BusinessException(
            'INVALID_SLOT',
            '현재 운영시간에 유효한 슬롯이 아닙니다.',
            HttpStatus.BAD_REQUEST,
        );
    }
    if (store.maxCapacityPerSlot === null) {
        throw new BusinessException(
            'INSUFFICIENT_CAPACITY',
            '해당 슬롯은 예약 정원이 설정되어 있지 않습니다.',
            HttpStatus.BAD_REQUEST,
        );
    }

    const legacySlot = input.slotId
        ? await tx.storeTimeSlot.findFirst({
              where: { id: input.slotId, storeId: input.storeId },
              select: { startAt: true, endAt: true },
          })
        : null;
    if (input.slotId && !legacySlot) {
        throw new BusinessException(
            'INVALID_SLOT',
            '현재 운영시간에 유효한 슬롯이 아닙니다.',
            HttpStatus.BAD_REQUEST,
        );
    }
    if (
        legacySlot &&
        input.startAt &&
        legacySlot.startAt.getTime() !== new Date(input.startAt).getTime()
    ) {
        throw new BusinessException(
            'INVALID_SLOT',
            '슬롯 식별자가 서로 일치하지 않습니다.',
            HttpStatus.BAD_REQUEST,
        );
    }

    const requestedStart = legacySlot?.startAt ?? (input.startAt ? new Date(input.startAt) : null);
    if (!requestedStart || Number.isNaN(requestedStart.getTime())) {
        throw new BusinessException(
            'INVALID_SLOT',
            '현재 운영시간에 유효한 슬롯이 아닙니다.',
            HttpStatus.BAD_REQUEST,
        );
    }
    const kst = toKstWallClock(requestedStart);
    const day = {
        year: kst.getUTCFullYear(),
        month: kst.getUTCMonth() + 1,
        day: kst.getUTCDate(),
    };
    const candidates = TimeSlotGenerationService.buildCandidates({
        interval: store.reservationIntervalMinutes,
        operatingHours: store.operatingHours.map((hour) => ({
            ...hour,
            dayOfWeek: hour.dayOfWeek as string,
        })),
        startParts: day,
        endParts: day,
        now: Date.now(),
        includePast: input.allowPast,
    }).candidates;
    const candidate = candidates.find(
        (item) =>
            item.startAt.getTime() === requestedStart.getTime() &&
            (!legacySlot || item.endAt.getTime() === legacySlot.endAt.getTime()) &&
            (!input.expectedEndAt ||
                item.endAt.getTime() === new Date(input.expectedEndAt).getTime()),
    );
    if (!candidate) {
        throw new BusinessException(
            'INVALID_SLOT',
            '현재 운영시간에 유효한 슬롯이 아닙니다.',
            HttpStatus.BAD_REQUEST,
        );
    }

    const [blocked, restriction, exactSlot, overlaps] = await Promise.all([
        tx.storeTimeSlot.findFirst({
            where: {
                storeId: input.storeId,
                status: { in: [StoreTimeSlotStatus.CLOSED, StoreTimeSlotStatus.CANCELED] },
                startAt: { lt: candidate.endAt },
                endAt: { gt: candidate.startAt },
            },
            select: { id: true },
        }),
        tx.reservationRestriction.findFirst({
            where: {
                storeId: input.storeId,
                programId: input.programId,
                startAt: { lt: candidate.endAt },
                endAt: { gt: candidate.startAt },
            },
            select: { id: true },
        }),
        tx.storeTimeSlot.findUnique({
            where: {
                storeId_startAt_endAt: {
                    storeId: input.storeId,
                    startAt: candidate.startAt,
                    endAt: candidate.endAt,
                },
            },
            select: { id: true },
        }),
        tx.reservation.findMany({
            where: {
                storeId: input.storeId,
                status: { not: 'CANCELED' },
                scheduledAt: { lt: candidate.endAt },
                scheduledEndAt: { gt: candidate.startAt },
            },
            select: {
                storeTimeSlotId: true,
                scheduledAt: true,
                scheduledEndAt: true,
                participantCount: true,
            },
        }),
    ]);

    if (blocked || restriction) {
        throw new BusinessException(
            'SLOT_BLOCKED',
            '해당 시간대는 예약할 수 없습니다.',
            HttpStatus.CONFLICT,
        );
    }

    const otherOverlaps = overlaps.filter((item) => item.storeTimeSlotId !== exactSlot?.id);
    if (
        otherOverlaps.some(
            (item) => item.scheduledAt < candidate.startAt || item.scheduledEndAt > candidate.endAt,
        )
    ) {
        throw new BusinessException(
            'SLOT_OVERLAP',
            '기존 예약과 시간이 겹쳐 예약할 수 없습니다.',
            HttpStatus.CONFLICT,
        );
    }
    const otherOverlap = otherOverlaps.reduce((sum, item) => sum + item.participantCount, 0);

    await tx.storeTimeSlot.createMany({
        data: [
            {
                storeId: input.storeId,
                startAt: candidate.startAt,
                endAt: candidate.endAt,
                status: StoreTimeSlotStatus.OPEN,
                reservedCount: 0,
            },
        ],
        skipDuplicates: true,
    });
    const slot = await tx.storeTimeSlot.findUniqueOrThrow({
        where: {
            storeId_startAt_endAt: {
                storeId: input.storeId,
                startAt: candidate.startAt,
                endAt: candidate.endAt,
            },
        },
        select: { id: true, startAt: true, endAt: true },
    });
    const incremented = await tryIncrementReservedCount(
        tx,
        slot.id,
        input.participantCount,
        store.maxCapacityPerSlot - otherOverlap,
    );
    if (!incremented) {
        throw new BusinessException(
            'INSUFFICIENT_CAPACITY',
            '잔여 정원이 부족합니다.',
            HttpStatus.BAD_REQUEST,
        );
    }
    return slot;
}
