import { VerificationStatus } from '@prisma/client';
import { StoreStatus } from '@todam/shared';
import type { PrismaService } from '../../../../database/prisma.service';
import { GetAdminStoreDetailUseCase, ListAdminStoresUseCase } from './admin-store.use-cases';

describe('admin store reads', () => {
    it('applies status, q, and pagination to the store list', async () => {
        const findMany = jest.fn().mockResolvedValue([]);
        const count = jest.fn().mockResolvedValue(0);
        const transaction = jest.fn().mockResolvedValue([[], 0]);
        const prisma = {
            store: { findMany, count },
            $transaction: transaction,
        } as unknown as PrismaService;

        await new ListAdminStoresUseCase(prisma).execute({
            status: StoreStatus.REJECTED,
            page: 3,
            limit: 20,
            q: '토담',
        });

        expect(findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    status: StoreStatus.REJECTED,
                    OR: expect.any(Array),
                }),
                skip: 40,
                take: 20,
            }),
        );
        expect(transaction).toHaveBeenCalled();
    });

    it('maps store detail relations to the admin contract', async () => {
        const createdAt = new Date('2026-06-11T00:00:00.000Z');
        const findUnique = jest.fn().mockResolvedValue({
            id: 'store-id',
            name: '토담',
            description: null,
            address: null,
            regionSido: null,
            regionSigungu: null,
            regionDong: null,
            phone: null,
            images: [],
            convenienceInfo: null,
            reservationIntervalMinutes: null,
            maxCapacityPerSlot: null,
            cancelDeadlineDays: null,
            autoConfirm: false,
            status: StoreStatus.PENDING,
            publishedAt: null,
            rejectedReason: null,
            suspendedReason: null,
            createdAt,
            businessDocs: [
                {
                    id: 'doc-id',
                    ownerName: '대표',
                    businessName: '토담',
                    businessNumber: '1234567890',
                    businessAddress: '서울',
                    startDate: null,
                    documentUrl: null,
                    verificationStatus: VerificationStatus.VERIFIED,
                    verifiedAt: createdAt,
                    businessState: null,
                },
            ],
            partner: { id: 'partner-id', user: { nickname: '닉네임', email: 'p@example.com' } },
        });
        const prisma = { store: { findUnique } } as unknown as PrismaService;

        const result = await new GetAdminStoreDetailUseCase(prisma).execute('store-id');

        expect(result.store.createdAt).toBe(createdAt.toISOString());
        expect(result.businessDocument?.verifiedAt).toBe(createdAt.toISOString());
        expect(result.partner.email).toBe('p@example.com');
    });
});
