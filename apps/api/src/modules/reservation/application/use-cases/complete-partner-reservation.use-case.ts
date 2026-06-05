import { HttpStatus, Injectable } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { PartnerReservationRepository } from '../../domain/repositories/partner-reservation.repository';
import { PartnerReservationPolicy } from '../../domain/services/partner-reservation-policy.service';
import type { PartnerReservationStatusResponseDto } from '../../presentation/dto/partner-reservation.dto';
import { findPartnerReservationForAction } from './partner-reservation-action-access';

@Injectable()
export class CompletePartnerReservationUseCase {
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
        if (reservation.status !== ReservationStatus.CONFIRMED) {
            throw new BusinessException(
                'INVALID_RESERVATION_STATUS',
                'Reservation is not confirmed.',
                HttpStatus.CONFLICT,
            );
        }
        if (
            !PartnerReservationPolicy.canComplete(
                reservation.status,
                reservation.scheduledAt,
                new Date(),
            )
        ) {
            throw new BusinessException(
                'EXPERIENCE_NOT_STARTED',
                'Experience has not started.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const updated = await this.reservations.complete(reservation);

        return {
            reservation: {
                id: updated.reservation.id,
                status: updated.reservation.status,
                artworkStatus: updated.artwork.status,
                updatedAt: updated.reservation.updatedAt.toISOString(),
            },
        };
    }
}
