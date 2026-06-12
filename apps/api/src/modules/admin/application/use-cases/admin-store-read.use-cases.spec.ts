import { VerificationStatus } from '@prisma/client';
import { StoreStatus } from '@todam/shared';
import type { S3Service } from '../../../../common/s3/s3.service';
import type { PrismaService } from '../../../../database/prisma.service';
import { GetAdminStoreDetailUseCase, ListAdminStoresUseCase } from './admin-store.use-cases';

jest.mock('../../../../common/s3/s3.service', () => ({ S3Service: class S3Service {} }));

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

    it('maps store detail relations and replaces documentUrl with a presigned GET URL', async () => {
        const createdAt = new Date('2026-06-11T00:00:00.000Z');
        const documentUrl = 'https://cdn.todam.app/business-documents/user-id/business-license.png';
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
                    documentUrl,
                    verificationStatus: VerificationStatus.VERIFIED,
                    verifiedAt: createdAt,
                    businessState: null,
                },
            ],
            partner: { id: 'partner-id', user: { nickname: '닉네임', email: 'p@example.com' } },
        });
        const prisma = { store: { findUnique } } as unknown as PrismaService;
        const createPresignedGetUrl = jest
            .fn()
            .mockResolvedValue('https://s3.example.com/presigned');
        const s3 = { createPresignedGetUrl } as unknown as S3Service;

        const result = await new GetAdminStoreDetailUseCase(prisma, s3).execute('store-id');

        expect(result.store.createdAt).toBe(createdAt.toISOString());
        expect(result.businessDocument?.verifiedAt).toBe(createdAt.toISOString());
        expect(result.businessDocument?.documentUrl).toBe('https://s3.example.com/presigned');
        expect(result.partner.email).toBe('p@example.com');
        expect(createPresignedGetUrl).toHaveBeenCalledWith(
            'business-documents/user-id/business-license.png',
        );
    });

    it('does not request a presigned URL when the business document has no image', async () => {
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
            createdAt: new Date('2026-06-11T00:00:00.000Z'),
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
                    verifiedAt: null,
                    businessState: null,
                },
            ],
            partner: { id: 'partner-id', user: { nickname: '닉네임', email: 'p@example.com' } },
        });
        const prisma = { store: { findUnique } } as unknown as PrismaService;
        const createPresignedGetUrl = jest.fn();
        const s3 = { createPresignedGetUrl } as unknown as S3Service;

        const result = await new GetAdminStoreDetailUseCase(prisma, s3).execute('store-id');

        expect(result.businessDocument?.documentUrl).toBeNull();
        expect(createPresignedGetUrl).not.toHaveBeenCalled();
    });
});
