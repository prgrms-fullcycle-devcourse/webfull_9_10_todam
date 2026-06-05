import { ReservationStatus } from '@prisma/client';
import { PartnerReservationPolicy } from './partner-reservation-policy.service';

describe('PartnerReservationPolicy', () => {
    it('masks reserver info only for canceled reservations', () => {
        expect(PartnerReservationPolicy.shouldMaskReserver(ReservationStatus.CANCELED)).toBe(true);
        expect(PartnerReservationPolicy.shouldMaskReserver(ReservationStatus.CONFIRMED)).toBe(
            false,
        );
    });

    it('masks reserver name and phone for detail responses', () => {
        expect(PartnerReservationPolicy.maskName('김토담')).toBe('김**');
        expect(PartnerReservationPolicy.maskPhone('010-1234-0000')).toBe('010-****-0000');
    });
});
