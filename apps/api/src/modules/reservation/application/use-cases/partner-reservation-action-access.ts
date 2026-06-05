import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
    PartnerReservationActionRow,
    PartnerReservationRepository,
} from '../../domain/repositories/partner-reservation.repository';

export async function findPartnerReservationForAction(
    reservations: PartnerReservationRepository,
    userId: string,
    reservationId: string,
): Promise<PartnerReservationActionRow> {
    const reservation = await reservations.findForAction(reservationId);

    if (!reservation) {
        throw new BusinessException(
            'RESERVATION_NOT_FOUND',
            'Reservation was not found.',
            HttpStatus.NOT_FOUND,
        );
    }

    if (reservation.partnerUserId !== userId) {
        throw new BusinessException('FORBIDDEN', 'Forbidden.', HttpStatus.FORBIDDEN);
    }

    return reservation;
}
