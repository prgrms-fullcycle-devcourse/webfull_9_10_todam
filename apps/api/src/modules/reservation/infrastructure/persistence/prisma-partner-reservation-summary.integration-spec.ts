import { PrismaPg } from '@prisma/adapter-pg';
import {
    PrismaClient,
    ReservationDeliveryMethod,
    ReservationSource,
    ReservationStatus,
} from '@prisma/client';
import type { PrismaService } from '../../../../database/prisma.service';
import { PrismaPartnerReservationRepository } from './prisma-partner-reservation.repository';

const TEST_DATABASE_URL = process.env['TEST_DATABASE_URL'];
if (!TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL is required for integration tests.');
}
if (!new URL(TEST_DATABASE_URL).pathname.includes('integration')) {
    throw new Error('TEST_DATABASE_URL must target a database containing "integration".');
}

describe('PrismaPartnerReservationRepository pending summary integration', () => {
    const prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: TEST_DATABASE_URL, ssl: false }),
    });
    const repository = new PrismaPartnerReservationRepository(prisma as unknown as PrismaService);
    const suffix = `pending-summary-${Date.now()}`;
    let userId: string;
    let partnerId: string;
    const storeIds: string[] = [];
    const programIds: string[] = [];
    const snapshotIds: string[] = [];
    const slotIds: string[] = [];
    const reservationIds: string[] = [];

    beforeAll(async () => {
        await prisma.$connect();

        const user = await prisma.user.create({
            data: {
                nickname: suffix,
                email: `${suffix}@example.com`,
                emailVerified: true,
                isPartner: true,
            },
            select: { id: true },
        });
        userId = user.id;

        const partner = await prisma.partner.create({
            data: { userId, status: 'APPROVED' },
            select: { id: true },
        });
        partnerId = partner.id;

        const primary = await createStoreFixture('primary');
        const other = await createStoreFixture('other');

        await createReservation(primary, '2026-06-07T14:59:59.000Z', ReservationStatus.PENDING);
        await createReservation(primary, '2026-06-07T15:00:00.000Z', ReservationStatus.PENDING);
        await createReservation(primary, '2026-06-08T14:59:59.000Z', ReservationStatus.PENDING);
        await createReservation(primary, '2026-06-08T15:00:00.000Z', ReservationStatus.PENDING);
        await createReservation(primary, '2026-06-08T16:00:00.000Z', ReservationStatus.CONFIRMED);
        await createReservation(other, '2026-06-08T16:00:00.000Z', ReservationStatus.PENDING);
    });

    afterAll(async () => {
        await prisma.reservation.deleteMany({ where: { id: { in: reservationIds } } });
        await prisma.storeTimeSlot.deleteMany({ where: { id: { in: slotIds } } });
        await prisma.programSnapshot.deleteMany({ where: { id: { in: snapshotIds } } });
        await prisma.program.deleteMany({ where: { id: { in: programIds } } });
        await prisma.store.deleteMany({ where: { id: { in: storeIds } } });
        await prisma.partner.deleteMany({ where: { id: partnerId } });
        await prisma.user.deleteMany({ where: { id: userId } });
        await prisma.$disconnect();
    });

    it('groups only future PENDING reservations by Asia/Seoul date', async () => {
        await expect(
            repository.countPendingByKstDate(storeIds[0]!, new Date('2026-06-07T15:00:00.000Z')),
        ).resolves.toEqual([
            { date: '2026-06-08', reservationCount: 2 },
            { date: '2026-06-09', reservationCount: 1 },
        ]);
    });

    async function createStoreFixture(label: string): Promise<{
        storeId: string;
        programId: string;
        snapshotId: string;
    }> {
        const store = await prisma.store.create({
            data: { partnerId, name: `${suffix}-${label}`, slug: `${suffix}-${label}` },
            select: { id: true },
        });
        storeIds.push(store.id);

        const program = await prisma.program.create({
            data: {
                storeId: store.id,
                title: `${suffix}-${label}`,
                price: 10000,
                durationMinutes: 60,
            },
            select: { id: true },
        });
        programIds.push(program.id);

        const snapshot = await prisma.programSnapshot.create({
            data: { programId: program.id, price: 10000, leadTimeDays: 30 },
            select: { id: true },
        });
        snapshotIds.push(snapshot.id);

        return { storeId: store.id, programId: program.id, snapshotId: snapshot.id };
    }

    async function createReservation(
        fixture: { storeId: string; programId: string; snapshotId: string },
        scheduledAt: string,
        status: ReservationStatus,
    ): Promise<void> {
        const startAt = new Date(scheduledAt);
        const slot = await prisma.storeTimeSlot.create({
            data: {
                storeId: fixture.storeId,
                startAt,
                endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
            },
            select: { id: true },
        });
        slotIds.push(slot.id);

        const reservation = await prisma.reservation.create({
            data: {
                programId: fixture.programId,
                storeId: fixture.storeId,
                storeTimeSlotId: slot.id,
                programSnapshotId: fixture.snapshotId,
                scheduledAt: startAt,
                scheduledEndAt: new Date(startAt.getTime() + 60 * 60 * 1000),
                reserverName: suffix,
                reserverPhone: '010-0000-0000',
                deliveryMethod: ReservationDeliveryMethod.PICKUP,
                status,
                source: ReservationSource.PARTNER_MANUAL,
            },
            select: { id: true },
        });
        reservationIds.push(reservation.id);
    }
});
