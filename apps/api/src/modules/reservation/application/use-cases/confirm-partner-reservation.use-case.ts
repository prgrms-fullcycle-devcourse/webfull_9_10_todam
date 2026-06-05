import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { PartnerReservationRepository } from '../../domain/repositories/partner-reservation.repository';
import { PartnerReservationPolicy } from '../../domain/services/partner-reservation-policy.service';
import type { PartnerReservationStatusResponseDto } from '../../presentation/dto/partner-reservation.dto';
import { findPartnerReservationForAction } from './partner-reservation-action-access';

@Injectable()
export class ConfirmPartnerReservationUseCase {
    constructor(private readonly reservations: PartnerReservationRepository) {}

    async execute(
        userId: string,
        reservationId: string,
    ): Promise<PartnerReservationStatusResponseDto> {
        const reservation = await findPartnerReservationForAction(
            this.reservations,
            userId,
            reservationId,
        );
        if (!PartnerReservationPolicy.canConfirm(reservation.status)) {
            throw new BusinessException(
                'INVALID_RESERVATION_STATUS',
                'Reservation is not pending.',
                HttpStatus.CONFLICT,
            );
        }

        const updated = await this.reservations.confirm(reservation);

        return {
            reservation: {
                id: updated.reservation.id,
                status: updated.reservation.status,
                artworkId: updated.artwork.id,
                updatedAt: updated.reservation.updatedAt.toISOString(),
            },
        };
    }
}
