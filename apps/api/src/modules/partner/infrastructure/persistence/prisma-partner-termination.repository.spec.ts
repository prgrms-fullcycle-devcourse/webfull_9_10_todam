import { PartnerStatus, ProgramStatus, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { PrismaPartnerTerminationRepository } from './prisma-partner-termination.repository';

function makeRepository(overrides: {
    partner?: { id: string } | null;
    activeReservation?: { id: string } | null;
    activeArtwork?: { id: string } | null;
}) {
    const tx = {
        partner: {
            findFirst: jest
                .fn()
                .mockResolvedValue(
                    overrides.partner === undefined ? { id: 'partner-1' } : overrides.partner,
                ),
            update: jest.fn().mockResolvedValue({}),
        },
        reservation: {
            findFirst: jest.fn().mockResolvedValue(overrides.activeReservation ?? null),
        },
        artwork: {
            findFirst: jest.fn().mockResolvedValue(overrides.activeArtwork ?? null),
        },
        program: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
        store: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        user: { update: jest.fn().mockResolvedValue({}) },
        refreshToken: { deleteMany: jest.fn().mockResolvedValue({ count: 3 }) },
    };
    const transaction: jest.Mock = jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
    );
    const prisma = {
        $transaction: transaction,
    } as unknown as PrismaService;

    return { repository: new PrismaPartnerTerminationRepository(prisma), tx, transaction };
}

describe('PrismaPartnerTerminationRepository', () => {
    it('does not mutate data when no approved partner exists', async () => {
        const { repository, tx } = makeRepository({ partner: null });

        await expect(repository.terminate('user-1')).resolves.toEqual({ outcome: 'NOT_FOUND' });
        expect(tx.reservation.findFirst).not.toHaveBeenCalled();
        expect(tx.program.updateMany).not.toHaveBeenCalled();
    });

    it('blocks termination before mutations when an active reservation exists', async () => {
        const { repository, tx } = makeRepository({ activeReservation: { id: 'reservation-1' } });

        await expect(repository.terminate('user-1')).resolves.toEqual({
            outcome: 'BLOCKED',
            partnerId: 'partner-1',
            reason: 'RESERVATION',
        });
        expect(tx.program.updateMany).not.toHaveBeenCalled();
        expect(tx.refreshToken.deleteMany).not.toHaveBeenCalled();
    });

    it('blocks termination before mutations when an unfinished artwork exists', async () => {
        const { repository, tx } = makeRepository({ activeArtwork: { id: 'artwork-1' } });

        await expect(repository.terminate('user-1')).resolves.toEqual({
            outcome: 'BLOCKED',
            partnerId: 'partner-1',
            reason: 'ARTWORK',
        });
        expect(tx.program.updateMany).not.toHaveBeenCalled();
        expect(tx.refreshToken.deleteMany).not.toHaveBeenCalled();
    });

    it('transitions partner-owned data and deletes refresh sessions in one transaction', async () => {
        const { repository, tx, transaction } = makeRepository({});

        await expect(repository.terminate('user-1')).resolves.toMatchObject({
            outcome: 'TERMINATED',
            partnerId: 'partner-1',
        });
        expect(tx.program.updateMany).toHaveBeenCalledWith({
            where: { store: { partnerId: 'partner-1' } },
            data: { status: ProgramStatus.INACTIVE },
        });
        expect(tx.store.updateMany).toHaveBeenCalledWith({
            where: { partnerId: 'partner-1' },
            data: { status: StoreStatus.SUSPENDED },
        });
        expect(tx.partner.update).toHaveBeenCalledWith({
            where: { id: 'partner-1' },
            data: { status: PartnerStatus.TERMINATED, terminatedAt: expect.any(Date) },
        });
        expect(tx.user.update).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: { isPartner: false },
        });
        expect(tx.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
        expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
            isolationLevel: 'Serializable',
        });
    });

    it('retries serialization conflicts up to a successful transaction', async () => {
        const { repository, transaction } = makeRepository({});
        transaction.mockRejectedValueOnce({ code: 'P2034' });

        await expect(repository.terminate('user-1')).resolves.toMatchObject({
            outcome: 'TERMINATED',
        });
        expect(transaction).toHaveBeenCalledTimes(2);
    });

    it('does not retry non-transaction errors', async () => {
        const { repository, transaction } = makeRepository({});
        const error = new Error('database unavailable');
        transaction.mockRejectedValueOnce(error);

        await expect(repository.terminate('user-1')).rejects.toBe(error);
        expect(transaction).toHaveBeenCalledTimes(1);
    });
});
