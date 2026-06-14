/// <reference types="jest" />
import { StoreTimeSlotStatus } from '@todam/shared';
import { UpdateTimeSlotStatusUseCase } from './update-time-slot-status.use-case';

describe('UpdateTimeSlotStatusUseCase', () => {
    const ownership = { verify: jest.fn() };
    const slots = { setStatusByKey: jest.fn() };
    const useCase = new UpdateTimeSlotStatusUseCase(ownership as never, slots as never);
    const slotKey = '2026-06-10T01:00:00.000Z|2026-06-10T02:00:00.000Z';

    beforeEach(() => {
        jest.clearAllMocks();
        ownership.verify.mockResolvedValue({ reservationIntervalMinutes: 60 });
        slots.setStatusByKey.mockResolvedValue(null);
    });

    it('materializes CLOSE by slotKey after current-grid validation', async () => {
        await useCase.execute('user-1', 'store-1', {
            slotKey,
            status: StoreTimeSlotStatus.CLOSED,
        });

        expect(slots.setStatusByKey).toHaveBeenCalledWith({
            storeId: 'store-1',
            startAt: new Date('2026-06-10T01:00:00.000Z'),
            endAt: new Date('2026-06-10T02:00:00.000Z'),
            status: 'CLOSED',
            validateCurrentCandidate: true,
        });
    });

    it('allows stale OPEN without current-grid validation', async () => {
        await useCase.execute('user-1', 'store-1', {
            slotKey: '2026-06-10T03:00:00.000Z|2026-06-10T04:00:00.000Z',
            status: StoreTimeSlotStatus.OPEN,
        });

        expect(slots.setStatusByKey).toHaveBeenCalledWith(
            expect.objectContaining({ validateCurrentCandidate: false }),
        );
    });
});
