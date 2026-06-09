import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { PartnerReservationRepository } from '../../domain/repositories/partner-reservation.repository';
import { GetPendingReservationSummaryUseCase } from './get-pending-reservation-summary.use-case';

describe('GetPendingReservationSummaryUseCase', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('returns the database KST date aggregation from the current KST day', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-08T03:00:00.000Z'));
        const reservations = {
            countPendingByKstDate: jest.fn().mockResolvedValue([
                { date: '2026-06-09', reservationCount: 2 },
                { date: '2026-06-10', reservationCount: 1 },
            ]),
        } as unknown as PartnerReservationRepository;
        const ownership = {
            verify: jest.fn().mockResolvedValue({}),
        } as unknown as StoreOwnershipService;

        const result = await new GetPendingReservationSummaryUseCase(
            reservations,
            ownership,
        ).execute('user-1', 'store-1');

        expect(ownership.verify).toHaveBeenCalledWith('user-1', 'store-1');
        expect(reservations.countPendingByKstDate).toHaveBeenCalledWith(
            'store-1',
            new Date('2026-06-07T15:00:00.000Z'),
        );
        expect(result).toEqual({
            dates: [
                { date: '2026-06-09', reservationCount: 2 },
                { date: '2026-06-10', reservationCount: 1 },
            ],
        });
    });
});
