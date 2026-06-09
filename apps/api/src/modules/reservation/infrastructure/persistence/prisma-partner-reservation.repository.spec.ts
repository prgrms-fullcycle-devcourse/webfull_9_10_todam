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
};

describe('PrismaPartnerReservationRepository artwork logs', () => {
    it('creates an initial RESERVED log when confirmation creates an artwork', async () => {
        const tx = {
            reservation: {
                update: jest.fn().mockResolvedValue({
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
                update: jest.fn().mockResolvedValue({
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
