import { ArtworkStatus, ReservationDeliveryMethod, ReservationStatus } from '@prisma/client';
import type { ArtworkDetailStatus, ArtworkStatusGroup } from '@todam/shared';

export const ARTWORK_SEQUENCE = [
    ArtworkStatus.RESERVED,
    ArtworkStatus.VISITED,
    ArtworkStatus.DRYING,
    ArtworkStatus.BISQUE_FIRING,
    ArtworkStatus.GLAZING,
    ArtworkStatus.GLAZE_FIRING,
    ArtworkStatus.COMPLETED,
] as const;

export class ArtworkPolicy {
    static canTransition(from: ArtworkStatus, to: ArtworkStatus): boolean {
        if (from === ArtworkStatus.CANCELED || from === ArtworkStatus.COMPLETED) return false;
        const fromIndex = ARTWORK_SEQUENCE.indexOf(from as (typeof ARTWORK_SEQUENCE)[number]);
        const toIndex = ARTWORK_SEQUENCE.indexOf(to as (typeof ARTWORK_SEQUENCE)[number]);
        return fromIndex >= 0 && toIndex >= 0 && Math.abs(fromIndex - toIndex) === 1;
    }

    static statusView(
        artwork: ArtworkStatus,
        reservation: ReservationStatus,
        deliveryMethod: ReservationDeliveryMethod,
    ): { group: ArtworkStatusGroup; detail: ArtworkDetailStatus } | null {
        if (artwork === ArtworkStatus.CANCELED || reservation === ReservationStatus.CANCELED) {
            return null;
        }
        if (reservation === ReservationStatus.DELIVERED) {
            return { group: 'RECEIVED', detail: 'DELIVERED' };
        }
        if (reservation === ReservationStatus.PICKUP_DONE) {
            return { group: 'RECEIVED', detail: 'PICKUP_DONE' };
        }
        if (reservation === ReservationStatus.SHIPPED) {
            return { group: 'RECEIVING', detail: 'SHIPPED' };
        }
        if (reservation === ReservationStatus.PICKUP_READY) {
            return { group: 'RECEIVING', detail: 'PICKUP_READY' };
        }
        if (artwork === ArtworkStatus.COMPLETED) {
            return {
                group: 'RECEIVING',
                detail:
                    deliveryMethod === ReservationDeliveryMethod.DELIVERY
                        ? 'DELIVERY_READY'
                        : 'PICKUP_READY',
            };
        }
        if (artwork === ArtworkStatus.RESERVED || artwork === ArtworkStatus.VISITED) {
            return { group: 'WAITING', detail: artwork };
        }
        return { group: 'IN_PROGRESS', detail: artwork };
    }
}
