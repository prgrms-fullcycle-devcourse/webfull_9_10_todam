import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { formatKstDate } from '../../domain/date.util';
import { availablePartnerReservationActions } from '../../domain/reservation-actions';
import { PartnerReservationRepository } from '../../domain/repositories/partner-reservation.repository';
import { PartnerReservationPolicy } from '../../domain/services/partner-reservation-policy.service';
import type { GetPartnerReservationDetailResponseDto } from '../../presentation/dto/partner-reservation.dto';

@Injectable()
export class GetPartnerReservationDetailUseCase {
    constructor(private readonly reservations: PartnerReservationRepository) {}

    async execute(
        userId: string,
        reservationId: string,
    ): Promise<GetPartnerReservationDetailResponseDto> {
        const row = await this.reservations.findDetail(reservationId);

        if (!row) {
            throw new BusinessException(
                'RESERVATION_NOT_FOUND',
                'Reservation was not found.',
                HttpStatus.NOT_FOUND,
            );
        }
        if (row.partnerUserId !== userId) {
            throw new BusinessException('FORBIDDEN', 'Forbidden.', HttpStatus.FORBIDDEN);
        }

        const maskReserver = PartnerReservationPolicy.shouldMaskReserver(row.status);

        return {
            reservation: {
                id: row.id,
                reservationNumber: this.reservationNumber(row),
                programTitle: row.programTitle,
                status: row.status,
                scheduledAt: row.scheduledAt.toISOString(),
                participantCount: row.participantCount,
                reserverName: maskReserver
                    ? PartnerReservationPolicy.maskName(row.reserverName)
                    : row.reserverName,
                reserverPhone: maskReserver
                    ? PartnerReservationPolicy.maskPhone(row.reserverPhone)
                    : row.reserverPhone,
                internalMemo: row.internalMemo,
                canceledAt: row.canceledAt?.toISOString() ?? null,
                cancelReason: row.cancelReason,
                artworkId: row.artworkId,
                availableActions: availablePartnerReservationActions(row.status),
                createdAt: row.createdAt.toISOString(),
            },
        };
    }

    private reservationNumber(row: { id: string; scheduledAt: Date }): string {
        const date = formatKstDate(row.scheduledAt).replace(/-/g, '');
        return `TODM-${date}-${row.id.slice(0, 8)}`;
    }
}
