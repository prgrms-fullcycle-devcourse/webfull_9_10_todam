/// <reference types="jest" />
import { materializeBookingSlot } from './booking-core';

const time = (hour: number) => new Date(Date.UTC(1970, 0, 1, hour));
const hours = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((dayOfWeek) => ({
    dayOfWeek,
    openTime: time(10),
    closeTime: time(12),
    breakStart: null,
    breakEnd: null,
}));
const startAt = new Date('2026-06-10T01:00:00.000Z');
const endAt = new Date('2026-06-10T02:00:00.000Z');

function makeTx(overlaps: unknown[] = []) {
    const calls: string[] = [];
    const tx = {
        $queryRaw: jest.fn(async () => {
            calls.push('lock');
            return [];
        }),
        store: {
            findUnique: jest.fn(async () => ({
                reservationIntervalMinutes: 60,
                maxCapacityPerSlot: 5,
                operatingHours: hours,
            })),
        },
        storeTimeSlot: {
            findFirst: jest.fn(async () => null),
            findUnique: jest
                .fn()
                .mockResolvedValueOnce(null)
                .mockResolvedValue({ id: 'slot-1', startAt, endAt }),
            createMany: jest.fn(async () => ({ count: 1 })),
            findUniqueOrThrow: jest.fn(async () => ({ id: 'slot-1', startAt, endAt })),
            updateMany: jest.fn(async () => ({ count: 1 })),
        },
        reservationRestriction: { findFirst: jest.fn(async () => null) },
        reservation: { findMany: jest.fn(async () => overlaps) },
    };
    return { tx, calls };
}

describe('materializeBookingSlot', () => {
    it('locks, validates, materializes, and increments a virtual slot', async () => {
        const { tx, calls } = makeTx();

        await expect(
            materializeBookingSlot(tx as never, {
                storeId: '11111111-1111-1111-1111-111111111111',
                programId: '22222222-2222-2222-2222-222222222222',
                participantCount: 2,
                startAt: startAt.toISOString(),
                allowPast: true,
            }),
        ).resolves.toEqual({ id: 'slot-1', startAt, endAt });

        expect(calls[0]).toBe('lock');
        expect(tx.storeTimeSlot.createMany).toHaveBeenCalledWith(
            expect.objectContaining({ skipDuplicates: true }),
        );
        expect(tx.storeTimeSlot.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ reservedCount: { lte: 3 } }),
            }),
        );
    });

    it('rejects a reservation that spills outside the requested virtual slot', async () => {
        const { tx } = makeTx([
            {
                storeTimeSlotId: 'old-slot',
                scheduledAt: new Date('2026-06-10T01:30:00.000Z'),
                scheduledEndAt: new Date('2026-06-10T02:30:00.000Z'),
                participantCount: 1,
            },
        ]);

        await expect(
            materializeBookingSlot(tx as never, {
                storeId: '11111111-1111-1111-1111-111111111111',
                programId: '22222222-2222-2222-2222-222222222222',
                participantCount: 1,
                startAt: startAt.toISOString(),
                allowPast: true,
            }),
        ).rejects.toMatchObject({ errorCode: 'SLOT_OVERLAP' });
        expect(tx.storeTimeSlot.createMany).not.toHaveBeenCalled();
    });
});
