/// <reference types="jest" />
import { GetProgramAvailableSlotsUseCase } from './get-program-available-slots.use-case';

const time = (hour: number) => new Date(Date.UTC(1970, 0, 1, hour));
const allDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((dayOfWeek) => ({
    dayOfWeek,
    openTime: time(10),
    closeTime: time(12),
    breakStart: null,
    breakEnd: null,
}));

describe('GetProgramAvailableSlotsUseCase', () => {
    const support = {
        findActiveProgramStore: jest.fn(),
        findOperatingHours: jest.fn(),
        findActiveReservationWindows: jest.fn(),
    };
    const blocks = { findOverlapping: jest.fn() };
    const restrictions = { findOverlapping: jest.fn() };
    const useCase = new GetProgramAvailableSlotsUseCase(
        support as never,
        blocks as never,
        restrictions as never,
    );

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2026-05-01T00:00:00.000Z'));
        jest.clearAllMocks();
        support.findActiveProgramStore.mockResolvedValue({
            storeId: 'store-1',
            maxCapacityPerSlot: 5,
            reservationIntervalMinutes: 120,
        });
        support.findOperatingHours.mockResolvedValue(allDays);
        support.findActiveReservationWindows.mockResolvedValue([]);
        blocks.findOverlapping.mockResolvedValue([]);
        restrictions.findOverlapping.mockResolvedValue([]);
    });

    afterEach(() => jest.useRealTimers());

    it('builds virtual candidates and subtracts contained active reservation capacity', async () => {
        support.findActiveReservationWindows.mockResolvedValue([
            {
                startAt: new Date('2026-06-10T02:00:00.000Z'),
                endAt: new Date('2026-06-10T03:00:00.000Z'),
                participantCount: 2,
                isConfirmed: true,
            },
        ]);

        const result = await useCase.execute('program-1', { year: 2026, month: 6 });
        const target = result.slots.find((slot) => slot.startAt === '2026-06-10T01:00:00.000Z')!;

        expect(target.slotKey).toBe('2026-06-10T01:00:00.000Z|2026-06-10T03:00:00.000Z');
        expect(target.reservedCount).toBe(2);
        expect(target.remainingCount).toBe(3);
        expect(target.isAvailable).toBe(true);
    });

    it('keeps both split candidates available while subtracting a cross-boundary reservation', async () => {
        support.findActiveProgramStore.mockResolvedValue({
            storeId: 'store-1',
            maxCapacityPerSlot: 5,
            reservationIntervalMinutes: 60,
        });
        support.findActiveReservationWindows.mockResolvedValue([
            {
                startAt: new Date('2026-06-10T01:00:00.000Z'),
                endAt: new Date('2026-06-10T03:00:00.000Z'),
                participantCount: 2,
                isConfirmed: true,
            },
        ]);

        const result = await useCase.execute('program-1', { year: 2026, month: 6 });
        const splitSlots = result.slots.filter((slot) =>
            ['2026-06-10T01:00:00.000Z', '2026-06-10T02:00:00.000Z'].includes(slot.startAt),
        );

        expect(splitSlots).toHaveLength(2);
        expect(splitSlots).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ reservedCount: 2, remainingCount: 3, isAvailable: true }),
                expect.objectContaining({ reservedCount: 2, remainingCount: 3, isAvailable: true }),
            ]),
        );
    });

    it('allows cross-boundary reservations but blocks CLOSED and this-program restrictions', async () => {
        support.findActiveReservationWindows.mockResolvedValue([
            {
                startAt: new Date('2026-06-10T02:00:00.000Z'),
                endAt: new Date('2026-06-10T04:00:00.000Z'),
                participantCount: 1,
                isConfirmed: true,
            },
        ]);
        blocks.findOverlapping.mockResolvedValue([
            {
                startAt: new Date('2026-06-11T02:00:00.000Z'),
                endAt: new Date('2026-06-11T03:00:00.000Z'),
            },
        ]);
        restrictions.findOverlapping.mockResolvedValue([
            {
                programId: 'program-1',
                startAt: new Date('2026-06-12T02:00:00.000Z'),
                endAt: new Date('2026-06-12T03:00:00.000Z'),
            },
            {
                programId: 'other-program',
                startAt: new Date('2026-06-13T02:00:00.000Z'),
                endAt: new Date('2026-06-13T03:00:00.000Z'),
            },
        ]);

        const result = await useCase.execute('program-1', { year: 2026, month: 6 });
        const availableByDay = new Map(
            result.slots.map((slot) => [slot.startAt.slice(0, 10), slot.isAvailable]),
        );
        expect(availableByDay.get('2026-06-10')).toBe(true);
        expect(availableByDay.has('2026-06-11')).toBe(false);
        expect(availableByDay.get('2026-06-12')).toBe(false);
        expect(availableByDay.get('2026-06-13')).toBe(true);
    });
});
