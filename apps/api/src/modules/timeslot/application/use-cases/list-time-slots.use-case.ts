import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, StoreTimeSlotStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreAccessService } from '../services/store-access.service';
import type {
    ListTimeSlotsQueryDto,
    ListTimeSlotsResponseDto,
} from '../../presentation/dto/list-time-slots.dto';
import { kstDayRange, parseDateOnly } from '../time.util';

@Injectable()
export class ListTimeSlotsUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storeAccess: StoreAccessService,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        query: ListTimeSlotsQueryDto,
    ): Promise<ListTimeSlotsResponseDto> {
        const store = await this.storeAccess.verifyOwnership(userId, storeId);

        const where: Prisma.StoreTimeSlotWhereInput = { storeId };

        // 날짜 필터 → 절대 시각 범위로 변환(KST 기준).
        const range = this.resolveRange(query);
        if (range) {
            where.startAt = { gte: range.start, lt: range.end };
        }

        if (query.status) {
            where.status = query.status as StoreTimeSlotStatus;
        }

        const slots = await this.prisma.storeTimeSlot.findMany({
            where,
            orderBy: { startAt: 'asc' },
            select: {
                id: true,
                startAt: true,
                endAt: true,
                reservedCount: true,
                status: true,
                createdAt: true,
            },
        });

        if (slots.length === 0) {
            return { slots: [] };
        }

        const slotStartAts = slots.map((s) => s.startAt);

        // 슬롯별 CONFIRMED 예약 수.
        const confirmedGroups = await this.prisma.reservation.groupBy({
            by: ['storeTimeSlotId'],
            where: {
                storeId,
                status: 'CONFIRMED',
                storeTimeSlot: { startAt: { in: slotStartAts } },
            },
            _count: { _all: true },
        });
        const confirmedBySlot = new Map<string, number>();
        for (const g of confirmedGroups) {
            confirmedBySlot.set(g.storeTimeSlotId, g._count._all);
        }

        // 제한(ReservationRestriction)은 시각 매칭 — 슬롯 startAt 기준.
        const restrictions = await this.prisma.reservationRestriction.findMany({
            where: { storeId, startAt: { in: slotStartAts } },
            select: { startAt: true, programId: true },
        });
        const restrictedByStartAt = new Map<number, string[]>();
        for (const r of restrictions) {
            const key = r.startAt.getTime();
            const list = restrictedByStartAt.get(key) ?? [];
            list.push(r.programId);
            restrictedByStartAt.set(key, list);
        }

        const maxCapacity = store.maxCapacityPerSlot ?? 0;

        return {
            slots: slots.map((s) => {
                const restrictedProgramIds = restrictedByStartAt.get(s.startAt.getTime()) ?? [];
                return {
                    slotId: s.id,
                    startAt: s.startAt.toISOString(),
                    endAt: s.endAt.toISOString(),
                    reservedCount: s.reservedCount,
                    remainingCount: maxCapacity - s.reservedCount,
                    status: s.status,
                    confirmedReservationCount: confirmedBySlot.get(s.id) ?? 0,
                    isRestricted: restrictedProgramIds.length > 0,
                    restrictedProgramIds,
                    createdAt: s.createdAt.toISOString(),
                };
            }),
        };
    }

    private resolveRange(query: ListTimeSlotsQueryDto): { start: Date; end: Date } | null {
        if (query.date) {
            const parts = parseDateOnly(query.date);
            if (!parts) {
                throw new BusinessException(
                    'INVALID_DATE_FORMAT',
                    'date 형식이 올바르지 않습니다.',
                    HttpStatus.BAD_REQUEST,
                );
            }
            return kstDayRange(parts);
        }

        if (query.startDate || query.endDate) {
            const startSrc = query.startDate ?? query.endDate!;
            const endSrc = query.endDate ?? query.startDate!;
            const startParts = parseDateOnly(startSrc);
            const endParts = parseDateOnly(endSrc);
            if (!startParts || !endParts) {
                throw new BusinessException(
                    'INVALID_DATE_FORMAT',
                    '날짜 형식이 올바르지 않습니다.',
                    HttpStatus.BAD_REQUEST,
                );
            }
            return {
                start: kstDayRange(startParts).start,
                end: kstDayRange(endParts).end,
            };
        }

        return null;
    }
}
