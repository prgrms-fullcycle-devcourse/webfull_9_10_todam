import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { PartnerReservationRepository } from '../../domain/repositories/partner-reservation.repository';
import { PartnerReservationPolicy } from '../../domain/services/partner-reservation-policy.service';
import type {
    CancelPartnerReservationDto,
    PartnerReservationStatusResponseDto,
} from '../../presentation/dto/partner-reservation.dto';
import { findPartnerReservationForAction } from './partner-reservation-action-access';

@Injectable()
export class CancelPartnerReservationUseCase {
    constructor(private readonly reservations: PartnerReservationRepository) {}

    async execute(
        userId: string,
        reservationId: string,
        dto: CancelPartnerReservationDto,
    ): Promise<PartnerReservationStatusResponseDto> {
        const reservation = await findPartnerReservationForAction(
            this.reservations,
            userId,
            reservationId,
        );
        if (!PartnerReservationPolicy.canCancel(reservation.status)) {
            throw new BusinessException(
                'INVALID_RESERVATION_STATUS',
                'Reservation cannot be canceled.',
                HttpStatus.CONFLICT,
            );
        }

        const updated = await this.reservations.cancel(reservation, userId, dto.cancelReason);

        return {
            reservation: {
                id: updated.id,
                status: updated.status,
                canceledBy: updated.canceledBy,
                cancelReason: updated.cancelReason,
                canceledAt: updated.canceledAt?.toISOString() ?? null,
            },
        };
    }
}
