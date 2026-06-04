import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { verifyStoreOwnership } from '../verify-store-ownership';
import type {
    GenerateTimeSlotsDto,
    GenerateTimeSlotsResponseDto,
} from '../../presentation/dto/generate-time-slots.dto';
import {
    eachDateInclusive,
    kstDayOfWeek,
    kstWallClockToInstant,
    parseDateOnly,
    timeColumnToMinutes,
} from '../time.util';

@Injectable()
export class GenerateTimeSlotsUseCase {
    private readonly logger = new Logger(GenerateTimeSlotsUseCase.name);

    constructor(private readonly prisma: PrismaService) {}

    async execute(
        userId: string,
        storeId: string,
        dto: GenerateTimeSlotsDto,
    ): Promise<GenerateTimeSlotsResponseDto> {
        const startParts = parseDateOnly(dto.startDate);
        const endParts = parseDateOnly(dto.endDate);

        if (!startParts || !endParts) {
            throw new BusinessException(
                'INVALID_DATE_RANGE',
                '날짜 형식이 올바르지 않습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const startKey = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
        const endKey = Date.UTC(endParts.year, endParts.month - 1, endParts.day);
        if (startKey > endKey) {
            throw new BusinessException(
                'INVALID_DATE_RANGE',
                'startDate는 endDate보다 이후일 수 없습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const store = await verifyStoreOwnership(this.prisma, userId, storeId);

        if (store.reservationIntervalMinutes == null || store.reservationIntervalMinutes <= 0) {
            throw new BusinessException(
                'INTERVAL_NOT_CONFIGURED',
                '예약 간격(reservationIntervalMinutes)이 설정되지 않았습니다.',
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }
        const interval = store.reservationIntervalMinutes;

        // 요일별 영업시간 조회.
        const operatingHours = await this.prisma.storeOperatingHour.findMany({
            where: { storeId },
            select: {
                dayOfWeek: true,
                openTime: true,
                closeTime: true,
                breakStart: true,
                breakEnd: true,
            },
        });

        if (operatingHours.length === 0) {
            throw new BusinessException(
                'OPERATING_HOURS_NOT_SET',
                '영업시간이 설정되지 않았습니다.',
                HttpStatus.CONFLICT,
            );
        }

        const hoursByDay = new Map<string, (typeof operatingHours)[number]>();
        for (const h of operatingHours) {
            hoursByDay.set(h.dayOfWeek, h);
        }

        const now = Date.now();
        const dates = eachDateInclusive(startParts, endParts);

        // 생성 후보 슬롯 계산.
        const candidates: { startAt: Date; endAt: Date }[] = [];
        let pastSkipped = 0;

        for (const parts of dates) {
            const dow = kstDayOfWeek(parts);
            const hour = hoursByDay.get(dow);
            if (!hour) continue; // 정기휴무(운영시간 미설정 요일).

            const openMin = timeColumnToMinutes(hour.openTime);
            const closeMin = timeColumnToMinutes(hour.closeTime);
            const breakStartMin = hour.breakStart ? timeColumnToMinutes(hour.breakStart) : null;
            const breakEndMin = hour.breakEnd ? timeColumnToMinutes(hour.breakEnd) : null;
            const hasBreak = breakStartMin != null && breakEndMin != null;

            for (let slotStart = openMin; slotStart + interval <= closeMin; slotStart += interval) {
                const slotEnd = slotStart + interval;

                // break 구간과 겹치면 제외.
                if (hasBreak && slotStart < breakEndMin! && slotEnd > breakStartMin!) {
                    continue;
                }

                const startAt = kstWallClockToInstant(parts, slotStart);
                const endAt = kstWallClockToInstant(parts, slotEnd);

                // 과거 시각 스킵.
                if (startAt.getTime() <= now) {
                    pastSkipped += 1;
                    continue;
                }

                candidates.push({ startAt, endAt });
            }
        }

        // 범위 내 전 요일 운영시간 미설정 + break/과거 외 후보가 전혀 없는 경우:
        // 운영 요일이 하나도 매칭되지 않으면 409.
        const anyOperatingDay = dates.some((parts) => hoursByDay.has(kstDayOfWeek(parts)));
        if (!anyOperatingDay) {
            throw new BusinessException(
                'OPERATING_HOURS_NOT_SET',
                '생성 범위 내 운영 요일이 없습니다.',
                HttpStatus.CONFLICT,
            );
        }

        // 멱등 — 이미 존재하는 startAt 스킵. 트랜잭션 처리.
        const created = await this.prisma.$transaction(async (tx) => {
            const existing = await tx.storeTimeSlot.findMany({
                where: {
                    storeId,
                    startAt: { in: candidates.map((c) => c.startAt) },
                },
                select: { startAt: true },
            });
            const existingKeys = new Set(existing.map((e) => e.startAt.getTime()));

            const toCreate = candidates.filter((c) => !existingKeys.has(c.startAt.getTime()));

            const createdSlots: {
                id: string;
                startAt: Date;
                endAt: Date;
                status: string;
                reservedCount: number;
            }[] = [];

            for (const c of toCreate) {
                const slot = await tx.storeTimeSlot.create({
                    data: {
                        storeId,
                        startAt: c.startAt,
                        endAt: c.endAt,
                        status: 'OPEN',
                        reservedCount: 0,
                    },
                    select: {
                        id: true,
                        startAt: true,
                        endAt: true,
                        status: true,
                        reservedCount: true,
                    },
                });
                createdSlots.push(slot);
            }

            return { createdSlots, alreadyExisting: existingKeys.size };
        });

        const skippedCount = pastSkipped + created.alreadyExisting;

        this.logger.log(
            `[generate] store=${storeId} range=${dto.startDate}~${dto.endDate} created=${created.createdSlots.length} skipped=${skippedCount}(past=${pastSkipped},existing=${created.alreadyExisting})`,
        );

        return {
            createdCount: created.createdSlots.length,
            skippedCount,
            createdSlots: created.createdSlots
                .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
                .map((s) => ({
                    slotId: s.id,
                    startAt: s.startAt.toISOString(),
                    endAt: s.endAt.toISOString(),
                    status: s.status,
                    reservedCount: s.reservedCount,
                })),
        };
    }
}
