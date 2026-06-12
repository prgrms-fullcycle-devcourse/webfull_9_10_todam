import { Test } from '@nestjs/testing';
import { PartnerStatus, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
    ApproveStoreUseCase,
    RejectStoreUseCase,
    RestoreStoreUseCase,
    SuspendStoreUseCase,
} from './admin-store.use-cases';

jest.mock('../../../../common/s3/s3.service', () => ({ S3Service: class S3Service {} }));

describe('admin store actions', () => {
    const updateMany = jest.fn();
    const findUnique = jest.fn();
    const findUniqueOrThrow = jest.fn();
    const partnerFindUniqueOrThrow = jest.fn();
    const partnerUpdateMany = jest.fn();
    const userUpdate = jest.fn();
    const tx = {
        store: { updateMany, findUnique, findUniqueOrThrow },
        partner: { findUniqueOrThrow: partnerFindUniqueOrThrow, updateMany: partnerUpdateMany },
        user: { update: userUpdate },
    };
    const transaction = jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx));
    const prisma = { $transaction: transaction } as unknown as PrismaService;
    const actionResult = {
        id: 'store-id',
        status: StoreStatus.PUBLISHED,
        publishedAt: new Date('2026-06-11T00:00:00.000Z'),
        rejectedReason: null,
        suspendedReason: null,
        updatedAt: new Date('2026-06-11T00:00:00.000Z'),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        updateMany.mockResolvedValue({ count: 1 });
        findUniqueOrThrow.mockResolvedValue(actionResult);
        partnerFindUniqueOrThrow.mockResolvedValue({ userId: 'user-id' });
        partnerUpdateMany.mockResolvedValue({ count: 1 });
    });

    it('injects PrismaService into every store action use case', async () => {
        const module = await Test.createTestingModule({
            providers: [
                ApproveStoreUseCase,
                RejectStoreUseCase,
                SuspendStoreUseCase,
                RestoreStoreUseCase,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        expect(module.get(ApproveStoreUseCase)).toBeDefined();
        expect(module.get(RejectStoreUseCase)).toBeDefined();
        expect(module.get(SuspendStoreUseCase)).toBeDefined();
        expect(module.get(RestoreStoreUseCase)).toBeDefined();
    });

    it('atomically approves a pending store and pending partner', async () => {
        findUniqueOrThrow.mockResolvedValueOnce({ ...actionResult, partnerId: 'partner-id' });

        await new ApproveStoreUseCase(prisma).execute('admin-id', 'store-id');

        expect(updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'store-id', status: StoreStatus.PENDING },
                data: expect.objectContaining({ status: StoreStatus.PUBLISHED }),
            }),
        );
        expect(partnerUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'partner-id', status: PartnerStatus.PENDING },
                data: expect.objectContaining({ status: PartnerStatus.APPROVED }),
            }),
        );
        expect(userUpdate).toHaveBeenCalledWith({
            where: { id: 'user-id' },
            data: { isPartner: true },
        });
    });

    it('does not rewrite the user capability for an already approved partner', async () => {
        findUniqueOrThrow.mockResolvedValueOnce({ ...actionResult, partnerId: 'partner-id' });
        partnerUpdateMany.mockResolvedValue({ count: 0 });

        await new ApproveStoreUseCase(prisma).execute('admin-id', 'store-id');

        expect(userUpdate).not.toHaveBeenCalled();
    });

    it('returns conflict when another request already changed the source status', async () => {
        updateMany.mockResolvedValue({ count: 0 });
        findUnique.mockResolvedValue({ id: 'store-id' });

        await expect(
            new RejectStoreUseCase(prisma).execute('admin-id', 'store-id', {
                rejectedReason: 'reason',
            }),
        ).rejects.toMatchObject({ errorCode: 'INVALID_STORE_STATUS' });
        expect(partnerUpdateMany).not.toHaveBeenCalled();
    });

    it('returns not found when the target store does not exist', async () => {
        updateMany.mockResolvedValue({ count: 0 });
        findUnique.mockResolvedValue(null);

        await expect(
            new RestoreStoreUseCase(prisma).execute('admin-id', 'missing-id'),
        ).rejects.toMatchObject({ errorCode: 'STORE_NOT_FOUND' });
    });

    it.each([
        [
            RejectStoreUseCase,
            StoreStatus.PENDING,
            StoreStatus.REJECTED,
            { rejectedReason: 'reason' },
        ],
        [
            SuspendStoreUseCase,
            StoreStatus.PUBLISHED,
            StoreStatus.SUSPENDED,
            { suspendedReason: 'reason' },
        ],
        [RestoreStoreUseCase, StoreStatus.SUSPENDED, StoreStatus.PUBLISHED, undefined],
    ])('performs the expected transition for %p', async (UseCase, from, to, dto) => {
        const useCase = new UseCase(prisma);

        if (dto) await useCase.execute('admin-id', 'store-id', dto as never);
        else await (useCase as RestoreStoreUseCase).execute('admin-id', 'store-id');

        expect(updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'store-id', status: from },
                data: expect.objectContaining({ status: to }),
            }),
        );
    });
});
