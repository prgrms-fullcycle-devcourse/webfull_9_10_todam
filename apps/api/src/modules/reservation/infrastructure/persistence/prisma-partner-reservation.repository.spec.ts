import { ArtworkStatus, ReservationStatus } from '@prisma/client';
import { PrismaPartnerReservationRepository } from './prisma-partner-reservation.repository';

const reservation = {
    id: 'reservation-1',
    storeId: 'store-1',
    storeTimeSlotId: 'slot-1',
    status: ReservationStatus.PENDING,
    scheduledAt: new Date('2026-06-08T01:00:00.000Z'),
    participantCount: 1,
    artwork: null,
    programTitle: 'Pottery',
    partnerUserId: 'partner-user-1',
    customerUserId: null,
};

describe('PrismaPartnerReservationRepository artwork logs', () => {
    it('creates an initial RESERVED log when confirmation creates an artwork', async () => {
        const tx = {
            reservation: {
                updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                findUniqueOrThrow: jest.fn().mockResolvedValue({
                    id: reservation.id,
                    status: ReservationStatus.CONFIRMED,
                    updatedAt: new Date(),
                }),
            },
            artwork: {
                create: jest.fn().mockResolvedValue({
                    id: 'artwork-1',
                    status: ArtworkStatus.RESERVED,
                }),
            },
            artworkLog: { create: jest.fn().mockResolvedValue({}) },
            qrToken: { upsert: jest.fn().mockResolvedValue({}) },
        };
        const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
        const repository = new PrismaPartnerReservationRepository(prisma as never);

        await repository.confirm(reservation);

        expect(tx.artworkLog.create).toHaveBeenCalledWith({
            data: {
                artworkId: 'artwork-1',
                changedBy: reservation.partnerUserId,
                fromStatus: null,
                toStatus: ArtworkStatus.RESERVED,
            },
        });
    });

    it('creates a RESERVED to DRYING log when an experience completes', async () => {
        const existing = {
            ...reservation,
            status: ReservationStatus.CONFIRMED,
            artwork: { id: 'artwork-1', status: ArtworkStatus.RESERVED },
        };
        const tx = {
            reservation: {
                updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                findUniqueOrThrow: jest.fn().mockResolvedValue({
                    id: reservation.id,
                    status: ReservationStatus.IN_PROGRESS,
                    updatedAt: new Date(),
                }),
            },
            artwork: {
                create: jest.fn(),
                update: jest.fn().mockResolvedValue({
                    id: 'artwork-1',
                    status: ArtworkStatus.DRYING,
                }),
            },
            artworkLog: { create: jest.fn().mockResolvedValue({}) },
        };
        const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
        const repository = new PrismaPartnerReservationRepository(prisma as never);

        await repository.complete(existing);

        expect(tx.artworkLog.create).toHaveBeenCalledWith({
            data: {
                artworkId: 'artwork-1',
                changedBy: reservation.partnerUserId,
                fromStatus: ArtworkStatus.RESERVED,
                toStatus: ArtworkStatus.DRYING,
            },
        });
    });
});

describe('PrismaPartnerReservationRepository.createManual', () => {
    it('requires the store to be published before creating a manual reservation', async () => {
        const tx = {
            $queryRaw: jest.fn(),
            program: { findFirst: jest.fn().mockResolvedValue(null) },
            store: { findUnique: jest.fn() },
        };
        const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
        const repository = new PrismaPartnerReservationRepository(prisma as never);

        await expect(
            repository.createManual('11111111-1111-1111-1111-111111111111', {
                changedBy: 'user-1',
                programId: 'program-1',
                startAt: '2026-06-10T01:00:00.000Z',
                reserverName: 'Customer',
                reserverPhone: '010-0000-0000',
                participantCount: 1,
                initialStatus: 'CONFIRMED',
            }),
        ).resolves.toBeNull();

        expect(tx.program.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    store: { status: 'PUBLISHED' },
                }),
            }),
        );
    });
});
