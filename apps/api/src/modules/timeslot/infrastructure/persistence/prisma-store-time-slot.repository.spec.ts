/// <reference types="jest" />
import { PrismaStoreTimeSlotRepository } from './prisma-store-time-slot.repository';

describe('PrismaStoreTimeSlotRepository.setStatusByKey', () => {
    const row = {
        id: 'slot-1',
        storeId: '11111111-1111-1111-1111-111111111111',
        startAt: new Date('2026-06-10T01:00:00.000Z'),
        endAt: new Date('2026-06-10T02:00:00.000Z'),
        reservedCount: 0,
        status: 'CLOSED',
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    };

    it('locks the store row before materializing and updating a closed slot', async () => {
        const calls: string[] = [];
        const tx = {
            $queryRaw: jest.fn(async () => {
                calls.push('lock');
                return [];
            }),
            storeTimeSlot: {
                findUnique: jest.fn(async () => {
                    calls.push('find');
                    return null;
                }),
                create: jest.fn(async () => {
                    calls.push('create');
                    return { ...row, status: 'OPEN' };
                }),
                update: jest.fn(async () => {
                    calls.push('update');
                    return row;
                }),
            },
            reservation: { count: jest.fn() },
            store: { findUnique: jest.fn() },
        };
        const prisma = { $transaction: (callback: (client: typeof tx) => unknown) => callback(tx) };
        const repository = new PrismaStoreTimeSlotRepository(prisma as never);

        await repository.setStatusByKey({
            storeId: row.storeId,
            startAt: row.startAt,
            endAt: row.endAt,
            status: 'CLOSED',
            validateCurrentCandidate: false,
        });

        expect(calls).toEqual(['lock', 'find', 'create', 'update']);
    });

    it('locks then leaves a missing stale OPEN slot as a no-op', async () => {
        const calls: string[] = [];
        const tx = {
            $queryRaw: jest.fn(async () => {
                calls.push('lock');
                return [];
            }),
            storeTimeSlot: {
                findUnique: jest.fn(async () => {
                    calls.push('find');
                    return null;
                }),
                create: jest.fn(),
                update: jest.fn(),
            },
            reservation: { count: jest.fn() },
            store: { findUnique: jest.fn() },
        };
        const prisma = { $transaction: (callback: (client: typeof tx) => unknown) => callback(tx) };
        const repository = new PrismaStoreTimeSlotRepository(prisma as never);

        await expect(
            repository.setStatusByKey({
                storeId: row.storeId,
                startAt: row.startAt,
                endAt: row.endAt,
                status: 'OPEN',
                validateCurrentCandidate: false,
            }),
        ).resolves.toBeNull();
        expect(calls).toEqual(['lock', 'find']);
        expect(tx.storeTimeSlot.create).not.toHaveBeenCalled();
    });

    it('rejects CANCELED when an active reservation overlaps the dynamic slot', async () => {
        const tx = {
            $queryRaw: jest.fn(async () => []),
            storeTimeSlot: {
                findUnique: jest.fn(async () => row),
                create: jest.fn(),
                update: jest.fn(),
            },
            reservation: { count: jest.fn(async () => 1) },
            store: { findUnique: jest.fn() },
        };
        const prisma = { $transaction: (callback: (client: typeof tx) => unknown) => callback(tx) };
        const repository = new PrismaStoreTimeSlotRepository(prisma as never);

        await expect(
            repository.setStatusByKey({
                storeId: row.storeId,
                startAt: row.startAt,
                endAt: row.endAt,
                status: 'CANCELED',
                validateCurrentCandidate: false,
            }),
        ).rejects.toThrow('ACTIVE_RESERVATIONS_EXIST');

        expect(tx.reservation.count).toHaveBeenCalledWith({
            where: {
                storeId: row.storeId,
                status: { not: 'CANCELED' },
                scheduledAt: { lt: row.endAt },
                scheduledEndAt: { gt: row.startAt },
            },
        });
        expect(tx.storeTimeSlot.update).not.toHaveBeenCalled();
    });

    it('locks before applying the legacy generated grid', async () => {
        const calls: string[] = [];
        const tx = {
            $queryRaw: jest.fn(async () => {
                calls.push('lock');
                return [];
            }),
            storeTimeSlot: {
                findMany: jest.fn(async () => {
                    calls.push('find');
                    return [];
                }),
            },
            reservation: { findMany: jest.fn() },
        };
        const prisma = { $transaction: (callback: (client: typeof tx) => unknown) => callback(tx) };
        const repository = new PrismaStoreTimeSlotRepository(prisma as never);

        await repository.applyGeneratedGrid({
            storeId: row.storeId,
            candidates: [],
            window: { start: row.startAt, end: row.endAt },
            now: new Date('2026-06-01T00:00:00.000Z'),
        });

        expect(calls).toEqual(['lock', 'find', 'find']);
    });
});
