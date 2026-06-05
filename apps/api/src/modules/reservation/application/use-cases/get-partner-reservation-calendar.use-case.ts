import { Injectable } from '@nestjs/common';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { eachMonthDate, formatKstDate, kstMonthRange } from '../../domain/date.util';
import { PartnerReservationRepository } from '../../domain/repositories/partner-reservation.repository';
import type {
    PartnerReservationCalendarQueryDto,
    PartnerReservationCalendarResponseDto,
} from '../../presentation/dto/partner-reservation.dto';

@Injectable()
export class GetPartnerReservationCalendarUseCase {
    constructor(
        private readonly reservations: PartnerReservationRepository,
        private readonly ownership: StoreOwnershipService,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        query: PartnerReservationCalendarQueryDto,
    ): Promise<PartnerReservationCalendarResponseDto> {
        const store = await this.ownership.verify(userId, storeId);

        const range = kstMonthRange(query.year, query.month);
        const calendar = await this.reservations.findCalendarData(storeId, range);

        const counts = new Map<string, number>();
        for (const reservation of calendar.reservations) {
            const date = formatKstDate(reservation.scheduledAt);
            counts.set(date, (counts.get(date) ?? 0) + 1);
        }

        const slotStats = new Map<string, { total: number; unavailable: number }>();
        for (const slot of calendar.slots) {
            const date = formatKstDate(slot.startAt);
            const stat = slotStats.get(date) ?? { total: 0, unavailable: 0 };
            stat.total += 1;
            const isFull =
                store.maxCapacityPerSlot !== null && slot.reservedCount >= store.maxCapacityPerSlot;
            if (slot.status !== 'OPEN' || isFull) stat.unavailable += 1;
            slotStats.set(date, stat);
        }

        const restrictionDates = new Set(
            calendar.restrictions.map((r) => formatKstDate(r.startAt)),
        );

        return {
            year: query.year,
            month: query.month,
            days: eachMonthDate(query.year, query.month).map((date) => {
                const stat = slotStats.get(date);
                const reservationCount = counts.get(date) ?? 0;
                return {
                    date,
                    hasReservation: reservationCount > 0,
                    isUnavailable: !stat || stat.total === 0 || stat.unavailable === stat.total,
                    hasRestriction: restrictionDates.has(date),
                    reservationCount,
                };
            }),
        };
    }
}
