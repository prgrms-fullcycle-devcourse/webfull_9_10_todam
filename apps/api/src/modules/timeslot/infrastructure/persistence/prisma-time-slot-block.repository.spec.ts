/// <reference types="jest" />
import { PrismaTimeSlotBlockRepository } from './prisma-time-slot-block.repository';

const storeId = '11111111-1111-1111-1111-111111111111';
const at = (hour: number) => new Date(`2026-06-10T${String(hour).padStart(2, '0')}:00:00.000Z`);

describe('PrismaTimeSlotBlockRepository.setStatus', () => {
    it('subtracts an opened range from an overlapping block', async () => {
        const tx = {
            $queryRaw: jest.fn(async () => []),
            timeSlotBlock: {
                findMany: jest.fn(async () => [
                    {
                        id: 'block-1',
                        storeId,
                        startAt: at(10),
                        endAt: at(12),
                        status: 'CLOSED',
                        updatedAt: at(9),
                    },
                ]),
                deleteMany: jest.fn(async () => ({ count: 1 })),
                createMany: jest.fn(async () => ({ count: 1 })),
            },
            store: { findUnique: jest.fn() },
            reservation: { count: jest.fn() },
        };
        const prisma = { $transaction: (callback: (client: typeof tx) => unknown) => callback(tx) };
        const repository = new PrismaTimeSlotBlockRepository(prisma as never);

        await repository.setStatus({
            storeId,
            startAt: at(10),
            endAt: at(11),
            status: 'OPEN',
            validateCurrentCandidate: false,
        });

        expect(tx.timeSlotBlock.createMany).toHaveBeenCalledWith({
            data: [{ storeId, startAt: at(11), endAt: at(12), status: 'CLOSED' }],
            skipDuplicates: true,
        });
    });

    it('merges adjacent blocks with the same status', async () => {
        const created = {
            id: 'block-2',
            storeId,
            startAt: at(10),
            endAt: at(12),
            status: 'CLOSED',
            updatedAt: at(9),
        };
        const tx = {
            $queryRaw: jest.fn(async () => []),
            timeSlotBlock: {
                findMany: jest
                    .fn()
                    .mockResolvedValueOnce([])
                    .mockResolvedValueOnce([{ ...created, id: 'block-1', endAt: at(11) }]),
                deleteMany: jest.fn(async () => ({ count: 1 })),
                create: jest.fn(async () => created),
            },
            store: { findUnique: jest.fn() },
            reservation: { count: jest.fn() },
        };
        const prisma = { $transaction: (callback: (client: typeof tx) => unknown) => callback(tx) };
        const repository = new PrismaTimeSlotBlockRepository(prisma as never);

        await repository.setStatus({
            storeId,
            startAt: at(11),
            endAt: at(12),
            status: 'CLOSED',
            validateCurrentCandidate: false,
        });

        expect(tx.timeSlotBlock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { storeId, startAt: at(10), endAt: at(12), status: 'CLOSED' },
            }),
        );
    });

    it('rejects CANCELED when an active reservation overlaps', async () => {
        const tx = {
            $queryRaw: jest.fn(async () => []),
            timeSlotBlock: { findMany: jest.fn(), deleteMany: jest.fn(), create: jest.fn() },
            store: { findUnique: jest.fn() },
            reservation: { count: jest.fn(async () => 1) },
        };
        const prisma = { $transaction: (callback: (client: typeof tx) => unknown) => callback(tx) };
        const repository = new PrismaTimeSlotBlockRepository(prisma as never);

        await expect(
            repository.setStatus({
                storeId,
                startAt: at(10),
                endAt: at(11),
                status: 'CANCELED',
                validateCurrentCandidate: false,
            }),
        ).rejects.toThrow('ACTIVE_RESERVATIONS_EXIST');
        expect(tx.timeSlotBlock.create).not.toHaveBeenCalled();
    });
});
