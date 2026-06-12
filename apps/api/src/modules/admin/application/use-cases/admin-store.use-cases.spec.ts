import { Test } from '@nestjs/testing';
import { NotificationCategory, PartnerStatus, StoreStatus } from '@prisma/client';
import { NotificationService } from '../../../notification/application/services/notification.service';
import { PrismaService } from '../../../../database/prisma.service';
import {
    ApproveStoreUseCase,
    RejectStoreUseCase,
    RestoreStoreUseCase,
    SuspendStoreUseCase,
} from './admin-store.use-cases';

jest.mock('../../../../common/s3/s3.service', () => ({ S3Service: class S3Service {} }));

function makeNotificationService(): jest.Mocked<Pick<NotificationService, 'createAndDispatch'>> {
    return { createAndDispatch: jest.fn().mockResolvedValue(undefined) };
}

describe('admin store actions', () => {
    const updateMany = jest.fn();
    const findUnique = jest.fn();
    const findUniqueOrThrow = jest.fn();
    const partnerFindUniqueOrThrow = jest.fn();
    const partnerUpdateMany = jest.fn();
    const userUpdate = jest.fn();
    // fetchPartnerUserId 내부에서 prisma.partner.findUnique 호출
    const partnerFindUnique = jest.fn().mockResolvedValue({ userId: 'partner-user-id' });
    const tx = {
        store: { updateMany, findUnique, findUniqueOrThrow },
        partner: { findUniqueOrThrow: partnerFindUniqueOrThrow, updateMany: partnerUpdateMany },
        user: { update: userUpdate },
    };
    const transaction = jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx));
    const prisma = {
        $transaction: transaction,
        partner: { findUnique: partnerFindUnique },
    } as unknown as PrismaService;
    const actionResult = {
        id: 'store-id',
        partnerId: 'partner-id',
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
        partnerFindUnique.mockResolvedValue({ userId: 'partner-user-id' });
    });

    it('injects PrismaService and NotificationService into every store action use case', async () => {
        const ns = makeNotificationService();
        const module = await Test.createTestingModule({
            providers: [
                ApproveStoreUseCase,
                RejectStoreUseCase,
                SuspendStoreUseCase,
                RestoreStoreUseCase,
                { provide: PrismaService, useValue: prisma },
                { provide: NotificationService, useValue: ns },
            ],
        }).compile();

        expect(module.get(ApproveStoreUseCase)).toBeDefined();
        expect(module.get(RejectStoreUseCase)).toBeDefined();
        expect(module.get(SuspendStoreUseCase)).toBeDefined();
        expect(module.get(RestoreStoreUseCase)).toBeDefined();
    });

    it('atomically approves a pending store and pending partner', async () => {
        findUniqueOrThrow.mockResolvedValueOnce({ ...actionResult, partnerId: 'partner-id' });
        const ns = makeNotificationService();

        await new ApproveStoreUseCase(prisma, ns as unknown as NotificationService).execute(
            'admin-id',
            'store-id',
        );

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
        const ns = makeNotificationService();

        await new ApproveStoreUseCase(prisma, ns as unknown as NotificationService).execute(
            'admin-id',
            'store-id',
        );

        expect(userUpdate).not.toHaveBeenCalled();
    });

    it('returns conflict when another request already changed the source status', async () => {
        updateMany.mockResolvedValue({ count: 0 });
        findUnique.mockResolvedValue({ id: 'store-id' });
        const ns = makeNotificationService();

        await expect(
            new RejectStoreUseCase(prisma, ns as unknown as NotificationService).execute(
                'admin-id',
                'store-id',
                { rejectedReason: 'reason' },
            ),
        ).rejects.toMatchObject({ errorCode: 'INVALID_STORE_STATUS' });
        expect(partnerUpdateMany).not.toHaveBeenCalled();
    });

    it('returns not found when the target store does not exist', async () => {
        updateMany.mockResolvedValue({ count: 0 });
        findUnique.mockResolvedValue(null);
        const ns = makeNotificationService();

        await expect(
            new RestoreStoreUseCase(prisma, ns as unknown as NotificationService).execute(
                'admin-id',
                'missing-id',
            ),
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
        const ns = makeNotificationService();
        const useCase = new UseCase(prisma, ns as unknown as NotificationService);

        if (dto) await useCase.execute('admin-id', 'store-id', dto as never);
        else await (useCase as RestoreStoreUseCase).execute('admin-id', 'store-id');

        expect(updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'store-id', status: from },
                data: expect.objectContaining({ status: to }),
            }),
        );
    });

    // ── P-6/P-7/P-8 알림 배선 ──────────────────────────────────────────────────

    describe('P-6 — approve 시 파트너 OPERATION 알림', () => {
        it('승인 후 createAndDispatch가 P-6 eventType으로 호출된다', async () => {
            findUniqueOrThrow.mockResolvedValueOnce({ ...actionResult, partnerId: 'partner-id' });
            const ns = makeNotificationService();

            await new ApproveStoreUseCase(prisma, ns as unknown as NotificationService).execute(
                'admin-id',
                'store-id',
            );

            expect(ns.createAndDispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientId: 'partner-user-id',
                    eventType: 'P-6',
                    category: NotificationCategory.OPERATION,
                    idempotencyKey: 'P-6:store-id:partner-user-id',
                }),
            );
        });
    });

    describe('P-7 — reject 시 파트너 OPERATION 알림', () => {
        it('반려 후 createAndDispatch가 P-7 eventType으로 호출된다', async () => {
            const ns = makeNotificationService();

            await new RejectStoreUseCase(prisma, ns as unknown as NotificationService).execute(
                'admin-id',
                'store-id',
                { rejectedReason: 'reason' },
            );

            expect(ns.createAndDispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientId: 'partner-user-id',
                    eventType: 'P-7',
                    category: NotificationCategory.OPERATION,
                    idempotencyKey: 'P-7:store-id:partner-user-id',
                }),
            );
        });
    });

    describe('P-8 — suspend 시 파트너 OPERATION 알림', () => {
        it('노출 중단 후 createAndDispatch가 P-8 eventType으로 호출된다', async () => {
            const ns = makeNotificationService();

            await new SuspendStoreUseCase(prisma, ns as unknown as NotificationService).execute(
                'admin-id',
                'store-id',
                { suspendedReason: 'reason' },
            );

            expect(ns.createAndDispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientId: 'partner-user-id',
                    eventType: 'P-8',
                    category: NotificationCategory.OPERATION,
                    idempotencyKey: 'P-8:store-id:partner-user-id',
                }),
            );
        });
    });
});
