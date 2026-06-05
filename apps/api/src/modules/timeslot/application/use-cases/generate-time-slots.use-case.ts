import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreAccessService } from '../services/store-access.service';
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

    constructor(
        private readonly prisma: PrismaService,
        private readonly storeAccess: StoreAccessService,
    ) {}

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

        const store = await this.storeAccess.verifyOwnership(userId, storeId);

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
            const hasBreak =
                breakStartMin != null &&
                breakEndMin != null &&
                breakStartMin < breakEndMin &&
                breakStartMin >= openMin &&
                breakEndMin <= closeMin;

            // break 는 하루를 구간으로 분할한다. 각 구간은 그 구간 시작점부터 back-to-back 격자.
            // (openTime 단일 격자에서 break 겹침만 제외하면, break 직후 슬롯이 구간 시작이 아닌
            //  openTime 기준 격자 시각으로 밀려 break~다음격자 사이가 버려진다.)
            const segments: [number, number][] = hasBreak
                ? [
                      [openMin, breakStartMin!],
                      [breakEndMin!, closeMin],
                  ]
                : [[openMin, closeMin]];

            for (const [segStart, segEnd] of segments) {
                for (
                    let slotStart = segStart;
                    slotStart + interval <= segEnd;
                    slotStart += interval
                ) {
                    const slotEnd = slotStart + interval;
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

        // 새 격자 식별은 (startAt, endAt) 쌍으로. startAt만 비교하면 interval 변경으로
        // 시작점이 겹치는 슬롯(예: openTime 슬롯)의 옛 endAt(길이)이 그대로 남는다.
        const pairKey = (startAt: Date, endAt: Date) => `${startAt.getTime()}_${endAt.getTime()}`;
        const candidatePairKeys = new Set(candidates.map((c) => pairKey(c.startAt, c.endAt)));

        // 생성 범위의 절대 시각 윈도우([startDate 00:00 KST, endDate 24:00 KST)).
        const windowStart = kstWallClockToInstant(startParts, 0);
        const windowEnd = kstWallClockToInstant(endParts, 24 * 60);
        const nowDate = new Date(now);

        // 멱등 생성 + prune(영업시간/요일/interval 변경으로 더 이상 새 격자에 없는
        // "예약 없는 미래 OPEN 슬롯" 삭제). 트랜잭션 처리.
        const result = await this.prisma.$transaction(async (tx) => {
            // ── prune: 윈도우 내 미래 OPEN 슬롯 중 새 격자에 없는 것 삭제.
            // 과거 슬롯·CLOSED/CANCELED(파트너 수동 조치)·예약 걸린 슬롯은 보존.
            const futureOpen = await tx.storeTimeSlot.findMany({
                where: {
                    storeId,
                    status: 'OPEN',
                    startAt: { gt: nowDate, gte: windowStart, lt: windowEnd },
                },
                select: { id: true, startAt: true, endAt: true },
            });
            // (startAt, endAt) 쌍이 새 격자에 없으면 stale — 시작점만 같고 길이가 다른 옛 슬롯 포함.
            const staleSlots = futureOpen.filter(
                (s) => !candidatePairKeys.has(pairKey(s.startAt, s.endAt)),
            );

            let removedCount = 0;
            if (staleSlots.length > 0) {
                // 활성 예약(CANCELED 외) 걸린 슬롯은 삭제 대상에서 제외.
                const staleIds = staleSlots.map((s) => s.id);
                const reserved = await tx.reservation.findMany({
                    where: {
                        storeTimeSlotId: { in: staleIds },
                        status: { not: 'CANCELED' },
                    },
                    select: { storeTimeSlotId: true },
                });
                const reservedIds = new Set(reserved.map((r) => r.storeTimeSlotId));
                const deletableIds = staleIds.filter((id) => !reservedIds.has(id));

                if (deletableIds.length > 0) {
                    const deleted = await tx.storeTimeSlot.deleteMany({
                        where: { id: { in: deletableIds } },
                    });
                    removedCount = deleted.count;
                }
            }

            // ── 멱등 생성: 이미 존재하는 startAt 스킵.
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

            return { createdSlots, alreadyExisting: existingKeys.size, removedCount };
        });

        const created = result;
        const skippedCount = pastSkipped + created.alreadyExisting;

        this.logger.log(
            `[generate] store=${storeId} range=${dto.startDate}~${dto.endDate} created=${created.createdSlots.length} removed=${created.removedCount} skipped=${skippedCount}(past=${pastSkipped},existing=${created.alreadyExisting})`,
        );

        return {
            createdCount: created.createdSlots.length,
            removedCount: created.removedCount,
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
