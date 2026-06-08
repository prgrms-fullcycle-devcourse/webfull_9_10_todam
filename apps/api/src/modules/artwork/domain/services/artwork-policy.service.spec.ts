import { ArtworkStatus, ReservationDeliveryMethod, ReservationStatus } from '@prisma/client';
import { ArtworkPolicy } from './artwork-policy.service';

describe('ArtworkPolicy', () => {
    it('allows only adjacent non-terminal artwork transitions', () => {
        expect(ArtworkPolicy.canTransition(ArtworkStatus.DRYING, ArtworkStatus.BISQUE_FIRING)).toBe(
            true,
        );
        expect(ArtworkPolicy.canTransition(ArtworkStatus.BISQUE_FIRING, ArtworkStatus.DRYING)).toBe(
            true,
        );
        expect(ArtworkPolicy.canTransition(ArtworkStatus.DRYING, ArtworkStatus.GLAZING)).toBe(
            false,
        );
        expect(
            ArtworkPolicy.canTransition(ArtworkStatus.COMPLETED, ArtworkStatus.GLAZE_FIRING),
        ).toBe(false);
    });

    it('maps artwork and reservation states to management groups', () => {
        expect(
            ArtworkPolicy.statusView(
                ArtworkStatus.DRYING,
                ReservationStatus.IN_PROGRESS,
                ReservationDeliveryMethod.PICKUP,
            ),
        ).toEqual({ group: 'IN_PROGRESS', detail: 'DRYING' });

        expect(
            ArtworkPolicy.statusView(
                ArtworkStatus.COMPLETED,
                ReservationStatus.SHIPPED,
                ReservationDeliveryMethod.DELIVERY,
            ),
        ).toEqual({ group: 'RECEIVING', detail: 'SHIPPED' });

        expect(
            ArtworkPolicy.statusView(
                ArtworkStatus.COMPLETED,
                ReservationStatus.PICKUP_DONE,
                ReservationDeliveryMethod.PICKUP,
            ),
        ).toEqual({ group: 'RECEIVED', detail: 'PICKUP_DONE' });
    });

    it('excludes canceled records', () => {
        expect(
            ArtworkPolicy.statusView(
                ArtworkStatus.CANCELED,
                ReservationStatus.IN_PROGRESS,
                ReservationDeliveryMethod.PICKUP,
            ),
        ).toBeNull();
    });
});
