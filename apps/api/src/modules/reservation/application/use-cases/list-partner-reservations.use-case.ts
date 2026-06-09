import { HttpStatus, Injectable } from '@nestjs/common';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { kstDayRange, parseDateOnly } from '../../../../common/date/kst-date.util';
import { PartnerReservationRepository } from '../../domain/repositories/partner-reservation.repository';
import type {
    ListPartnerReservationsQueryDto,
    ListPartnerReservationsResponseDto,
} from '../../presentation/dto/partner-reservation.dto';

@Injectable()
export class ListPartnerReservationsUseCase {
    constructor(
        private readonly reservations: PartnerReservationRepository,
        private readonly ownership: StoreOwnershipService,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        query: ListPartnerReservationsQueryDto,
    ): Promise<ListPartnerReservationsResponseDto> {
        await this.ownership.verify(userId, storeId);

        const parts = parseDateOnly(query.date);
        if (!parts) {
            throw new BusinessException(
                'INVALID_DATE_PARAMS',
                'date must be YYYY-MM-DD.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const limit = query.limit ?? 20;
        const rows = await this.reservations.findList(storeId, {
            range: kstDayRange(parts),
            status: query.status,
            programId: query.programId,
            cursor: query.cursor,
            limit,
        });

        const page = rows.slice(0, limit);
        return {
            reservations: page.map((row) => ({
                id: row.id,
                programTitle: row.programTitle,
                durationMinutes: row.durationMinutes,
                scheduledAt: row.scheduledAt.toISOString(),
                reserverName: row.reserverName,
                participantCount: row.participantCount,
                status: row.status,
                source: row.source,
                createdAt: row.createdAt.toISOString(),
            })),
            nextCursor: rows.length > limit ? (page.at(-1)?.id ?? null) : null,
            hasMore: rows.length > limit,
        };
    }
}
