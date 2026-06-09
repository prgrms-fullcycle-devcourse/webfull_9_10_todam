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

/**
 * P0 동시성 회귀 테스트.
 *
 * - 상태 전이 원자화: 동시 confirm 요청 중 정확히 1건만 성공한다.
 * - 정원 차감 원자화: 같은 슬롯의 동시 cancel 시 reservedCount 차감이 유실되지 않는다.
 *
 * 검증 후 id만으로 update / 조회 후 계산하여 저장하던 구현에서는 둘 다 깨질 수 있었다.
 */
describe('PrismaPartnerReservationRepository concurrency integration', () => {
    const prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: TEST_DATABASE_URL, ssl: false }),
    });
    const repository = new PrismaPartnerReservationRepository(prisma as unknown as PrismaService);
    const suffix = `concurrency-${Date.now()}`;
    let userId: string;
    let partnerId: string;
    let storeId: string;
    let programId: string;
    let snapshotId: string;
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

        const store = await prisma.store.create({
            data: { partnerId, name: suffix, slug: suffix, maxCapacityPerSlot: 10 },
            select: { id: true },
        });
        storeId = store.id;

        const program = await prisma.program.create({
            data: { storeId, title: suffix, price: 10000, durationMinutes: 60 },
            select: { id: true },
        });
        programId = program.id;

        const snapshot = await prisma.programSnapshot.create({
            data: { programId, price: 10000, leadTimeDays: 30 },
            select: { id: true },
        });
        snapshotId = snapshot.id;
    });

    afterAll(async () => {
        const artworks = await prisma.artwork.findMany({
            where: { reservationId: { in: reservationIds } },
            select: { id: true },
        });
        const artworkIds = artworks.map((a) => a.id);
        await prisma.qrToken.deleteMany({ where: { artworkId: { in: artworkIds } } });
        await prisma.artworkLog.deleteMany({ where: { artworkId: { in: artworkIds } } });
        await prisma.artwork.deleteMany({ where: { id: { in: artworkIds } } });
        await prisma.reservation.deleteMany({ where: { id: { in: reservationIds } } });
        await prisma.storeTimeSlot.deleteMany({ where: { id: { in: slotIds } } });
        await prisma.programSnapshot.deleteMany({ where: { id: snapshotId } });
        await prisma.program.deleteMany({ where: { id: programId } });
        await prisma.store.deleteMany({ where: { id: storeId } });
        await prisma.partner.deleteMany({ where: { id: partnerId } });
        await prisma.user.deleteMany({ where: { id: userId } });
        await prisma.$disconnect();
    });

    it('동시 confirm 요청 중 정확히 1건만 성공하고 나머지는 INVALID_RESERVATION_STATUS', async () => {
        const { reservationId } = await createReservation({
            startAt: new Date('2026-07-01T01:00:00.000Z'),
            reservedCount: 2,
            participantCount: 2,
            status: ReservationStatus.PENDING,
        });

        // 두 요청 모두 같은 PENDING 스냅샷을 읽은 뒤 동시에 confirm 시도.
        const row = await repository.findForAction(reservationId);
        if (!row) throw new Error('fixture reservation not found');

        const results = await Promise.allSettled([
            repository.confirm(row),
            repository.confirm(row),
        ]);

        const fulfilled = results.filter((r) => r.status === 'fulfilled');
        const rejected = results.filter((r) => r.status === 'rejected');
        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);
        expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
            errorCode: 'INVALID_RESERVATION_STATUS',
        });

        const after = await prisma.reservation.findUniqueOrThrow({
            where: { id: reservationId },
            select: { status: true },
        });
        expect(after.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('같은 슬롯 동시 cancel 시 reservedCount 차감이 유실되지 않는다', async () => {
        const startAt = new Date('2026-07-02T01:00:00.000Z');
        // 한 슬롯에 2인 예약 2건 → reservedCount=4 로 시작.
        const slot = await prisma.storeTimeSlot.create({
            data: {
                storeId,
                startAt,
                endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
                reservedCount: 4,
            },
            select: { id: true },
        });
        slotIds.push(slot.id);

        const first = await createReservationOnSlot(slot.id, startAt, 2);
        const second = await createReservationOnSlot(slot.id, startAt, 2);

        const [rowA, rowB] = await Promise.all([
            repository.findForAction(first),
            repository.findForAction(second),
        ]);
        if (!rowA || !rowB) throw new Error('fixture reservations not found');

        await Promise.all([
            repository.cancel(rowA, userId, '동시성 테스트'),
            repository.cancel(rowB, userId, '동시성 테스트'),
        ]);

        const after = await prisma.storeTimeSlot.findUniqueOrThrow({
            where: { id: slot.id },
            select: { reservedCount: true },
        });
        // 4 - 2 - 2 = 0. read-modify-write 였다면 한쪽 차감이 유실되어 2가 남을 수 있다.
        expect(after.reservedCount).toBe(0);
    });

    it('동일 예약 동시 cancel 시 상태 전이·정원 차감이 정확히 1회만 실행된다', async () => {
        const startAt = new Date('2026-07-03T01:00:00.000Z');
        // reservedCount=5 로 시작(다른 예약분 포함 가정). 2인 예약 1건을 동시에 두 번 취소.
        // 1회 차감이면 5-2=3, 이중 차감이면 5-2-2=1 → floor(0)에 걸리지 않아 이중 실행을 감지한다.
        const slot = await prisma.storeTimeSlot.create({
            data: {
                storeId,
                startAt,
                endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
                reservedCount: 5,
            },
            select: { id: true },
        });
        slotIds.push(slot.id);

        const reservationId = await createReservationOnSlot(slot.id, startAt, 2);
        const row = await repository.findForAction(reservationId);
        if (!row) throw new Error('fixture reservation not found');

        const results = await Promise.allSettled([
            repository.cancel(row, userId, '동시성 테스트'),
            repository.cancel(row, userId, '동시성 테스트'),
        ]);

        const fulfilled = results.filter((r) => r.status === 'fulfilled');
        const rejected = results.filter((r) => r.status === 'rejected');
        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);
        expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
            errorCode: 'INVALID_RESERVATION_STATUS',
        });

        const slotAfter = await prisma.storeTimeSlot.findUniqueOrThrow({
            where: { id: slot.id },
            select: { reservedCount: true },
        });
        // 정확히 1회 차감: 5 - 2 = 3.
        expect(slotAfter.reservedCount).toBe(3);

        const reservationAfter = await prisma.reservation.findUniqueOrThrow({
            where: { id: reservationId },
            select: { status: true },
        });
        expect(reservationAfter.status).toBe(ReservationStatus.CANCELED);
    });

    async function createReservation(args: {
        startAt: Date;
        reservedCount: number;
        participantCount: number;
        status: ReservationStatus;
    }): Promise<{ slotId: string; reservationId: string }> {
        const slot = await prisma.storeTimeSlot.create({
            data: {
                storeId,
                startAt: args.startAt,
                endAt: new Date(args.startAt.getTime() + 60 * 60 * 1000),
                reservedCount: args.reservedCount,
            },
            select: { id: true },
        });
        slotIds.push(slot.id);
        const reservationId = await createReservationOnSlot(
            slot.id,
            args.startAt,
            args.participantCount,
            args.status,
        );
        return { slotId: slot.id, reservationId };
    }

    async function createReservationOnSlot(
        slotId: string,
        scheduledAt: Date,
        participantCount: number,
        status: ReservationStatus = ReservationStatus.CONFIRMED,
    ): Promise<string> {
        const reservation = await prisma.reservation.create({
            data: {
                programId,
                storeId,
                storeTimeSlotId: slotId,
                programSnapshotId: snapshotId,
                scheduledAt,
                reserverName: suffix,
                reserverPhone: '010-0000-0000',
                participantCount,
                deliveryMethod: ReservationDeliveryMethod.PICKUP,
                status,
                source: ReservationSource.PARTNER_MANUAL,
            },
            select: { id: true },
        });
        reservationIds.push(reservation.id);
        return reservation.id;
    }
});
