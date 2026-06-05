import { ReservationStatus } from '@prisma/client';

export type PartnerReservationAction = 'CONFIRM' | 'REJECT' | 'CANCEL' | 'COMPLETE';

export function availablePartnerReservationActions(
    status: ReservationStatus,
): PartnerReservationAction[] {
    switch (status) {
        case ReservationStatus.PENDING:
            return ['CONFIRM', 'REJECT', 'CANCEL'];
        case ReservationStatus.CONFIRMED:
            return ['CANCEL', 'COMPLETE'];
        default:
            return [];
    }
}
