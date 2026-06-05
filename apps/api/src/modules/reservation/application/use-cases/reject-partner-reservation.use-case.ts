import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { PartnerReservationRepository } from '../../domain/repositories/partner-reservation.repository';
import { PartnerReservationPolicy } from '../../domain/services/partner-reservation-policy.service';
import type {
    PartnerReservationStatusResponseDto,
    RejectPartnerReservationDto,
} from '../../presentation/dto/partner-reservation.dto';
import { findPartnerReservationForAction } from './partner-reservation-action-access';

@Injectable()
export class RejectPartnerReservationUseCase {
    constructor(private readonly reservations: PartnerReservationRepository) {}

    async execute(
        userId: string,
        reservationId: string,
        dto: RejectPartnerReservationDto,
    ): Promise<PartnerReservationStatusResponseDto> {
        const reservation = await findPartnerReservationForAction(
            this.reservations,
            userId,
            reservationId,
        );
        if (!PartnerReservationPolicy.canReject(reservation.status)) {
            throw new BusinessException(
                'INVALID_RESERVATION_STATUS',
                'Reservation is not pending.',
                HttpStatus.CONFLICT,
            );
        }

        const updated = await this.reservations.reject(
            reservation,
            userId,
            dto.rejectReason ?? null,
        );

        return {
            reservation: {
                id: updated.id,
                status: updated.status,
                updatedAt: updated.updatedAt.toISOString(),
            },
        };
    }
}
