/// <reference types="jest" />
import { ListTimeSlotsUseCase } from './list-time-slots.use-case';

describe('ListTimeSlotsUseCase', () => {
    const ownership = { verify: jest.fn() };
    const blocks = { findOverlapping: jest.fn() };
    const restrictions = { findOverlapping: jest.fn() };
    const support = {
        findOperatingHours: jest.fn(),
        findActiveReservationWindows: jest.fn(),
    };
    const useCase = new ListTimeSlotsUseCase(
        ownership as never,
        blocks as never,
        restrictions as never,
        support as never,
    );

    beforeEach(() => {
        jest.clearAllMocks();
        ownership.verify.mockResolvedValue({
            reservationIntervalMinutes: 60,
            maxCapacityPerSlot: 5,
        });
        support.findOperatingHours.mockResolvedValue([
            {
                dayOfWeek: 'WED',
                openTime: new Date(Date.UTC(1970, 0, 1, 10)),
                closeTime: new Date(Date.UTC(1970, 0, 1, 11)),
                breakStart: null,
                breakEnd: null,
            },
        ]);
        support.findActiveReservationWindows.mockResolvedValue([]);
        blocks.findOverlapping.mockResolvedValue([]);
        restrictions.findOverlapping.mockResolvedValue([]);
    });

    it('includes partner past candidates and uses overlap range reads', async () => {
        const result = await useCase.execute('user-1', 'store-1', { date: '2026-06-10' });

        expect(result.slots[0]!.slotKey).toBe('2026-06-10T01:00:00.000Z|2026-06-10T02:00:00.000Z');
        expect(support.findActiveReservationWindows).toHaveBeenCalledWith('store-1', {
            start: new Date('2026-06-09T15:00:00.000Z'),
            end: new Date('2026-06-10T15:00:00.000Z'),
        });
    });

    it('rejects an inverted or over-92-day range', async () => {
        await expect(
            useCase.execute('user-1', 'store-1', {
                startDate: '2026-06-10',
                endDate: '2026-06-09',
            }),
        ).rejects.toMatchObject({ errorCode: 'INVALID_DATE_RANGE' });
        await expect(
            useCase.execute('user-1', 'store-1', {
                startDate: '2026-01-01',
                endDate: '2026-04-03',
            }),
        ).rejects.toMatchObject({ errorCode: 'INVALID_DATE_RANGE' });
    });

    it('subtracts capacity but keeps a split candidate available when capacity remains', async () => {
        support.findActiveReservationWindows.mockResolvedValue([
            {
                startAt: new Date('2026-06-10T00:30:00.000Z'),
                endAt: new Date('2026-06-10T01:30:00.000Z'),
                participantCount: 1,
                isConfirmed: true,
            },
        ]);

        const result = await useCase.execute('user-1', 'store-1', { date: '2026-06-10' });

        expect(result.slots[0]).toMatchObject({
            reservedCount: 1,
            remainingCount: 4,
            confirmedReservationCount: 1,
            isAvailable: true,
        });
    });

    it('exposes the exact stale blocked slotKey so the partner can reopen it', async () => {
        blocks.findOverlapping.mockResolvedValue([
            {
                startAt: new Date('2026-06-10T01:30:00.000Z'),
                endAt: new Date('2026-06-10T02:30:00.000Z'),
                status: 'CLOSED',
            },
        ]);

        const result = await useCase.execute('user-1', 'store-1', { date: '2026-06-10' });

        expect(result.slots[0]).toMatchObject({
            slotKey: '2026-06-10T01:00:00.000Z|2026-06-10T02:00:00.000Z',
            status: 'CLOSED',
            blockingSlotKeys: ['2026-06-10T01:30:00.000Z|2026-06-10T02:30:00.000Z'],
        });
    });
});
