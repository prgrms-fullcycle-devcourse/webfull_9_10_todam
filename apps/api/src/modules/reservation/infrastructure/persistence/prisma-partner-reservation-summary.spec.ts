import { PrismaService } from '../../../../database/prisma.service';
import { PrismaPartnerReservationRepository } from './prisma-partner-reservation.repository';

describe('PrismaPartnerReservationRepository pending summary', () => {
    it('returns the database date aggregation result', async () => {
        const rows = [{ date: '2026-06-09', reservationCount: 2 }];
        const prisma = {
            $queryRaw: jest.fn().mockResolvedValue(rows),
        } as unknown as PrismaService;

        await expect(
            new PrismaPartnerReservationRepository(prisma).countPendingByKstDate(
                '11111111-1111-1111-1111-111111111111',
                new Date('2026-06-07T15:00:00.000Z'),
            ),
        ).resolves.toEqual(rows);
        expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });
});
