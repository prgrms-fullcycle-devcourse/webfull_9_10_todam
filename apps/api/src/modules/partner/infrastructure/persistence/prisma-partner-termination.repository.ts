import { Injectable } from '@nestjs/common';
import {
    ArtworkStatus,
    PartnerStatus,
    Prisma,
    ProgramStatus,
    ReservationStatus,
    StoreStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
    PartnerTerminationRepository,
    TerminatePartnerResult,
} from '../../domain/repositories/partner-termination.repository';

const MAX_TRANSACTION_ATTEMPTS = 3;

@Injectable()
export class PrismaPartnerTerminationRepository extends PartnerTerminationRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async terminate(userId: string): Promise<TerminatePartnerResult> {
        for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
            try {
                return await this.prisma.$transaction(
                    async (tx) => this.terminateInTransaction(tx, userId),
                    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
                );
            } catch (error) {
                if (!this.isTransactionConflict(error) || attempt === MAX_TRANSACTION_ATTEMPTS) {
                    throw error;
                }
            }
        }

        throw new Error('Partner termination transaction retry exhausted.');
    }

    private async terminateInTransaction(
        tx: Prisma.TransactionClient,
        userId: string,
    ): Promise<TerminatePartnerResult> {
        const partner = await tx.partner.findFirst({
            where: { userId, status: PartnerStatus.APPROVED },
            select: { id: true },
        });
        if (!partner) return { outcome: 'NOT_FOUND' };

        const activeReservation = await tx.reservation.findFirst({
            where: {
                store: { partnerId: partner.id },
                status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
            },
            select: { id: true },
        });
        if (activeReservation) {
            return { outcome: 'BLOCKED', partnerId: partner.id, reason: 'RESERVATION' };
        }

        const activeArtwork = await tx.artwork.findFirst({
            where: {
                reservation: { store: { partnerId: partner.id } },
                status: { notIn: [ArtworkStatus.COMPLETED, ArtworkStatus.CANCELED] },
            },
            select: { id: true },
        });
        if (activeArtwork) {
            return { outcome: 'BLOCKED', partnerId: partner.id, reason: 'ARTWORK' };
        }

        const terminatedAt = new Date();
        await tx.program.updateMany({
            where: { store: { partnerId: partner.id } },
            data: { status: ProgramStatus.INACTIVE },
        });
        await tx.store.updateMany({
            where: { partnerId: partner.id },
            data: { status: StoreStatus.SUSPENDED },
        });
        await tx.partner.update({
            where: { id: partner.id },
            data: { status: PartnerStatus.TERMINATED, terminatedAt },
        });
        await tx.user.update({
            where: { id: userId },
            data: { isPartner: false },
        });
        await tx.refreshToken.deleteMany({ where: { userId } });

        return { outcome: 'TERMINATED', partnerId: partner.id, terminatedAt };
    }

    private isTransactionConflict(error: unknown): boolean {
        return (
            typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034'
        );
    }
}
