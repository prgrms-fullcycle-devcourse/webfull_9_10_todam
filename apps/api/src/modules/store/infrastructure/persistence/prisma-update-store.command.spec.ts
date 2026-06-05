import { PrismaUpdateStoreCommand } from './prisma-update-store.command';

describe('PrismaUpdateStoreCommand', () => {
    it('deletes every store image without using an invalid UUID sentinel for an empty list', async () => {
        const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
        const tx = {
            storeImage: {
                findMany: jest
                    .fn()
                    .mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440000' }]),
                deleteMany,
                update: jest.fn(),
            },
            store: {
                update: jest.fn().mockResolvedValue({
                    id: 'store-1',
                    name: '토담 공방',
                    slug: 'todam-store',
                    status: 'DRAFT',
                    updatedAt: new Date('2026-06-05T00:00:00.000Z'),
                }),
            },
            storeOperatingHour: {
                deleteMany: jest.fn(),
                createMany: jest.fn(),
            },
        };
        const prisma = {
            partner: { findUnique: jest.fn().mockResolvedValue({ id: 'partner-1' }) },
            store: {
                findUnique: jest.fn().mockResolvedValue({ id: 'store-1', partnerId: 'partner-1' }),
            },
            $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
        };
        const command = new PrismaUpdateStoreCommand(prisma as never);

        await command.execute('user-1', 'store-1', { images: [] });

        expect(deleteMany).toHaveBeenCalledWith({ where: { storeId: 'store-1' } });
    });
});
