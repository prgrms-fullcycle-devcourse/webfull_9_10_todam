import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { TimeSlotStatus } from '../../domain/entities/store-time-slot.entity';
import { StoreTimeSlotRepository } from '../../domain/repositories/store-time-slot.repository';
import { ReservationRestrictionRepository } from '../../domain/repositories/reservation-restriction.repository';
import { TimeslotSupportReader } from '../../domain/repositories/timeslot-support.reader';
import { kstDayRange, parseDateOnly } from '../../../../common/date/kst-date.util';
import type {
    ListTimeSlotsQueryDto,
    ListTimeSlotsResponseDto,
} from '../../presentation/dto/list-time-slots.dto';

@Injectable()
export class ListTimeSlotsUseCase {
    constructor(
        private readonly ownership: StoreOwnershipService,
        private readonly slots: StoreTimeSlotRepository,
        private readonly restrictions: ReservationRestrictionRepository,
        private readonly support: TimeslotSupportReader,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        query: ListTimeSlotsQueryDto,
    ): Promise<ListTimeSlotsResponseDto> {
        const store = await this.ownership.verify(userId, storeId);

        const range = this.resolveRange(query);
        const slots = await this.slots.findByStore(storeId, {
            range: range ?? undefined,
            status: query.status ? (query.status as TimeSlotStatus) : undefined,
        });

        if (slots.length === 0) {
            return { slots: [] };
        }

        const slotIds = slots.map((s) => s.id);
        const slotStartAts = slots.map((s) => s.startAt);

        // 슬롯별 CONFIRMED 예약 수.
        const confirmedBySlot = await this.support.countConfirmedBySlotIds(storeId, slotIds);

        // 제한(ReservationRestriction)은 시각 매칭 — 슬롯 startAt 기준.
        const restrictions = await this.restrictions.findByStartAts(storeId, slotStartAts);
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
                    remainingCount: s.remainingCount(maxCapacity),
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
