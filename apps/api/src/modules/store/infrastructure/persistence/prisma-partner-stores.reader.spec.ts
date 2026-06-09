import { PrismaService } from '../../../../database/prisma.service';
import { PrismaPartnerStoresReader } from './prisma-partner-stores.reader';

describe('PrismaPartnerStoresReader', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('loads KST today reservation counts in the store list query', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-08T16:00:00.000Z'));
        const prisma = {
            partner: { findUnique: jest.fn().mockResolvedValue({ id: 'partner-1' }) },
            store: {
                findMany: jest.fn().mockResolvedValue([
                    {
                        id: 'store-1',
                        name: '토담 공방',
                        status: 'PUBLISHED',
                        createdAt: new Date('2026-06-01T00:00:00.000Z'),
                        businessDocs: [{ ownerName: '김토담' }],
                        _count: { reservations: 3 },
                    },
                ]),
            },
        } as unknown as PrismaService;

        const result = await new PrismaPartnerStoresReader(prisma).execute('user-1');

        expect(prisma.store.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                select: expect.objectContaining({
                    _count: {
                        select: {
                            reservations: {
                                where: {
                                    scheduledAt: {
                                        gte: new Date('2026-06-08T15:00:00.000Z'),
                                        lt: new Date('2026-06-09T15:00:00.000Z'),
                                    },
                                },
                            },
                        },
                    },
                }),
            }),
        );
        expect(result.stores[0]?.todayReservationCount).toBe(3);
    });
});
