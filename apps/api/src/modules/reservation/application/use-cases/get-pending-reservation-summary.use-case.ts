import { Injectable } from '@nestjs/common';
import type { PendingReservationSummary } from '@todam/shared';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { currentKstDayRange } from '../../../../common/date/kst-date.util';
import { PartnerReservationRepository } from '../../domain/repositories/partner-reservation.repository';

@Injectable()
export class GetPendingReservationSummaryUseCase {
    constructor(
        private readonly reservations: PartnerReservationRepository,
        private readonly ownership: StoreOwnershipService,
    ) {}

    async execute(userId: string, storeId: string): Promise<PendingReservationSummary> {
        await this.ownership.verify(userId, storeId);

        const start = currentKstDayRange().start;
        return {
            dates: await this.reservations.countPendingByKstDate(storeId, start),
        };
    }
}
