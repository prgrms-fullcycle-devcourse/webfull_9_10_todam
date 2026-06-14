/// <reference types="jest" />
import { PrismaReservationRestrictionRepository } from './prisma-reservation-restriction.repository';

describe('PrismaReservationRestrictionRepository.createManyIdempotent', () => {
    it('updates endAt when the same store, startAt, and program restriction changes duration', async () => {
        const existing = {
            id: 'restriction-1',
            storeId: '11111111-1111-1111-1111-111111111111',
            startAt: new Date('2026-06-10T01:00:00.000Z'),
            endAt: new Date('2026-06-10T02:00:00.000Z'),
            programId: 'program-1',
            createdBy: 'user-1',
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
        };
        const changedEndAt = new Date('2026-06-10T03:00:00.000Z');
        const tx = {
            $queryRaw: jest.fn(),
            reservationRestriction: {
                findUnique: jest.fn().mockResolvedValue(existing),
                update: jest.fn().mockResolvedValue({ ...existing, endAt: changedEndAt }),
                create: jest.fn(),
            },
        };
        const prisma = { $transaction: (callback: (client: typeof tx) => unknown) => callback(tx) };
        const repository = new PrismaReservationRestrictionRepository(prisma as never);

        const result = await repository.createManyIdempotent([
            {
                storeId: existing.storeId,
                startAt: existing.startAt,
                endAt: changedEndAt,
                programId: existing.programId,
                createdBy: 'user-2',
            },
        ]);

        expect(tx.reservationRestriction.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: existing.id },
                data: { endAt: changedEndAt, createdBy: 'user-2' },
            }),
        );
        expect(tx.reservationRestriction.create).not.toHaveBeenCalled();
        expect(result[0]!.endAt).toEqual(changedEndAt);
    });
});

describe('PrismaReservationRestrictionRepository.deleteByConditions', () => {
    it('matches the complete startAt and endAt pair', async () => {
        const tx = {
            $queryRaw: jest.fn(),
            reservationRestriction: {
                deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
        };
        const prisma = { $transaction: (callback: (client: typeof tx) => unknown) => callback(tx) };
        const repository = new PrismaReservationRestrictionRepository(prisma as never);
        const timeRange = {
            startAt: new Date('2026-06-10T01:00:00.000Z'),
            endAt: new Date('2026-06-10T03:00:00.000Z'),
        };

        await repository.deleteByConditions('11111111-1111-1111-1111-111111111111', {
            timeRanges: [timeRange],
            programIds: ['program-1'],
        });

        expect(tx.reservationRestriction.deleteMany).toHaveBeenCalledWith({
            where: {
                storeId: '11111111-1111-1111-1111-111111111111',
                OR: [timeRange],
                programId: { in: ['program-1'] },
            },
        });
    });
});
