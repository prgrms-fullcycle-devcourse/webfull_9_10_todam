import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { NotificationCategory, PartnerStatus, Prisma, StoreStatus } from '@prisma/client';
import {
    BusinessState,
    VerificationStatus,
    type AdminStoreActionResponse,
    type AdminStoreDetailResponse,
    type AdminStoreListQuery,
    type AdminStoreListResponse,
    type AdminStoreRejectRequest,
    type AdminStoreSuspendRequest,
} from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { keyFromImageUrl } from '../../../../common/s3/s3-object.util';
import { S3Service } from '../../../../common/s3/s3.service';
import { PrismaService } from '../../../../database/prisma.service';
import { NotificationService } from '../../../notification/application/services/notification.service';

const storeDetailSelect = {
    id: true,
    name: true,
    description: true,
    address: true,
    regionSido: true,
    regionSigungu: true,
    regionDong: true,
    phone: true,
    convenienceInfo: true,
    reservationIntervalMinutes: true,
    maxCapacityPerSlot: true,
    cancelDeadlineDays: true,
    autoConfirm: true,
    status: true,
    publishedAt: true,
    rejectedReason: true,
    suspendedReason: true,
    createdAt: true,
    images: {
        orderBy: { sortOrder: 'asc' as const },
        select: { imageUrl: true, isThumbnail: true },
    },
    businessDocs: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        select: {
            id: true,
            ownerName: true,
            businessName: true,
            businessNumber: true,
            businessAddress: true,
            startDate: true,
            documentUrl: true,
            verificationStatus: true,
            verifiedAt: true,
            businessState: true,
        },
    },
    partner: {
        select: {
            id: true,
            user: { select: { nickname: true, email: true } },
        },
    },
} satisfies Prisma.StoreSelect;

const actionSelect = {
    id: true,
    status: true,
    publishedAt: true,
    rejectedReason: true,
    suspendedReason: true,
    updatedAt: true,
} satisfies Prisma.StoreSelect;

const actionWithPartnerSelect = {
    ...actionSelect,
    partnerId: true,
} satisfies Prisma.StoreSelect;

function notFound(): BusinessException {
    return new BusinessException(
        'STORE_NOT_FOUND',
        '공방을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
    );
}

function invalidStatus(): BusinessException {
    return new BusinessException(
        'INVALID_STORE_STATUS',
        '현재 공방 상태에서는 요청한 작업을 수행할 수 없습니다.',
        HttpStatus.CONFLICT,
    );
}

function actionResponse(store: {
    id: string;
    status: StoreStatus;
    publishedAt: Date | null;
    rejectedReason: string | null;
    suspendedReason: string | null;
    updatedAt: Date;
}): AdminStoreActionResponse {
    return {
        store: {
            id: store.id,
            status: store.status as AdminStoreActionResponse['store']['status'],
            publishedAt: store.publishedAt?.toISOString() ?? null,
            rejectedReason: store.rejectedReason,
            suspendedReason: store.suspendedReason,
            updatedAt: store.updatedAt.toISOString(),
        },
    };
}

async function transitionStore(
    tx: Prisma.TransactionClient,
    storeId: string,
    fromStatus: StoreStatus,
    data: Prisma.StoreUpdateManyMutationInput,
) {
    const result = await tx.store.updateMany({
        where: { id: storeId, status: fromStatus },
        data,
    });
    if (result.count === 0) {
        const exists = await tx.store.findUnique({ where: { id: storeId }, select: { id: true } });
        if (!exists) throw notFound();
        throw invalidStatus();
    }

    return tx.store.findUniqueOrThrow({ where: { id: storeId }, select: actionWithPartnerSelect });
}

@Injectable()
export class ListAdminStoresUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(query: AdminStoreListQuery): Promise<AdminStoreListResponse> {
        const where: Prisma.StoreWhereInput = {
            status: query.status as StoreStatus,
            ...(query.q
                ? {
                      OR: [
                          { name: { contains: query.q, mode: 'insensitive' } },
                          {
                              businessDocs: {
                                  some: {
                                      businessName: { contains: query.q, mode: 'insensitive' },
                                  },
                              },
                          },
                      ],
                  }
                : {}),
        };
        const [stores, totalCount] = await this.prisma.$transaction([
            this.prisma.store.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    address: true,
                    regionSido: true,
                    regionSigungu: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    partner: {
                        select: { id: true, user: { select: { nickname: true } } },
                    },
                    businessDocs: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: {
                            id: true,
                            businessName: true,
                            businessNumber: true,
                            ownerName: true,
                            verificationStatus: true,
                        },
                    },
                },
            }),
            this.prisma.store.count({ where }),
        ]);

        return {
            stores: stores.map((store) => ({
                storeId: store.id,
                name: store.name,
                phone: store.phone,
                address: store.address,
                regionSido: store.regionSido,
                regionSigungu: store.regionSigungu,
                status: store.status as AdminStoreListResponse['stores'][number]['status'],
                createdAt: store.createdAt.toISOString(),
                updatedAt: store.updatedAt.toISOString(),
                partner: { partnerId: store.partner.id, nickname: store.partner.user.nickname },
                businessDocument: store.businessDocs[0]
                    ? {
                          documentId: store.businessDocs[0].id,
                          businessName: store.businessDocs[0].businessName,
                          businessNumber: store.businessDocs[0].businessNumber,
                          ownerName: store.businessDocs[0].ownerName,
                          verificationStatus: store.businessDocs[0]
                              .verificationStatus as VerificationStatus,
                      }
                    : null,
            })),
            pagination: {
                currentPage: query.page,
                limit: query.limit,
                totalCount,
                totalPages: Math.ceil(totalCount / query.limit),
            },
        };
    }
}

@Injectable()
export class GetAdminStoreDetailUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly s3: S3Service,
    ) {}

    async execute(storeId: string): Promise<AdminStoreDetailResponse> {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: storeDetailSelect,
        });
        if (!store) throw notFound();
        const doc = store.businessDocs[0] ?? null;
        const documentUrl = doc?.documentUrl
            ? await this.s3.createPresignedGetUrl(keyFromImageUrl(doc.documentUrl))
            : null;

        return {
            store: {
                id: store.id,
                name: store.name,
                description: store.description,
                address: store.address,
                regionSido: store.regionSido,
                regionSigungu: store.regionSigungu,
                regionDong: store.regionDong,
                phone: store.phone,
                images: store.images,
                convenienceInfo:
                    store.convenienceInfo as AdminStoreDetailResponse['store']['convenienceInfo'],
                reservationIntervalMinutes: store.reservationIntervalMinutes,
                maxCapacityPerSlot: store.maxCapacityPerSlot,
                cancelDeadlineDays: store.cancelDeadlineDays,
                autoConfirm: store.autoConfirm,
                status: store.status as AdminStoreDetailResponse['store']['status'],
                publishedAt: store.publishedAt?.toISOString() ?? null,
                rejectedReason: store.rejectedReason,
                suspendedReason: store.suspendedReason,
                createdAt: store.createdAt.toISOString(),
            },
            businessDocument: doc
                ? {
                      ...doc,
                      documentUrl,
                      verificationStatus: doc.verificationStatus as VerificationStatus,
                      businessState: doc.businessState as BusinessState | null,
                      verifiedAt: doc.verifiedAt?.toISOString() ?? null,
                  }
                : null,
            partner: {
                id: store.partner.id,
                nickname: store.partner.user.nickname,
                email: store.partner.user.email,
            },
        };
    }
}

abstract class StoreActionUseCase {
    protected readonly logger = new Logger(this.constructor.name);
    constructor(
        protected readonly prisma: PrismaService,
        protected readonly notificationService: NotificationService,
    ) {}

    protected log(adminId: string, storeId: string, action: string): void {
        this.logger.log({ adminId, storeId, action, timestamp: new Date().toISOString() });
    }

    /** store.partnerId 로 파트너 User id 조회 */
    protected async fetchPartnerUserId(partnerId: string): Promise<string | null> {
        const partner = await this.prisma.partner.findUnique({
            where: { id: partnerId },
            select: { userId: true },
        });
        return partner?.userId ?? null;
    }
}

@Injectable()
export class ApproveStoreUseCase extends StoreActionUseCase {
    constructor(prisma: PrismaService, notificationService: NotificationService) {
        super(prisma, notificationService);
    }

    async execute(adminId: string, storeId: string): Promise<AdminStoreActionResponse> {
        const now = new Date();
        const updated = await this.prisma.$transaction(async (tx) => {
            const store = await transitionStore(tx, storeId, StoreStatus.PENDING, {
                status: StoreStatus.PUBLISHED,
                publishedAt: now,
                rejectedReason: null,
                suspendedReason: null,
            });
            const partner = await tx.partner.findUniqueOrThrow({
                where: { id: store.partnerId },
                select: { userId: true },
            });
            const partnerUpdate = await tx.partner.updateMany({
                where: { id: store.partnerId, status: PartnerStatus.PENDING },
                data: { status: PartnerStatus.APPROVED, approvedAt: now },
            });
            if (partnerUpdate.count === 1) {
                await tx.user.update({
                    where: { id: partner.userId },
                    data: { isPartner: true },
                });
            }
            return store;
        });
        this.log(adminId, storeId, 'approve');

        // P-6: PENDING→PUBLISHED(검수 승인) 시 파트너에게 알림 (plan §5 P-6, 정책 §5.3)
        // 트랜잭션 커밋 이후 side-effect — 발송 실패가 상태 전이 롤백 유발 금지 (plan §2)
        const partnerUserId = await this.fetchPartnerUserId(updated.partnerId);
        if (partnerUserId) {
            await this.notificationService.createAndDispatch({
                recipientId: partnerUserId,
                eventType: 'P-6',
                category: NotificationCategory.OPERATION,
                title: '공방 검수 승인',
                body: '공방 검수가 승인됐어요. 운영을 시작하세요.',
                deepLink: `/partner`,
                idempotencyKey: `P-6:${storeId}:${partnerUserId}`,
            });
        }

        return actionResponse(updated);
    }
}

@Injectable()
export class RejectStoreUseCase extends StoreActionUseCase {
    constructor(prisma: PrismaService, notificationService: NotificationService) {
        super(prisma, notificationService);
    }

    async execute(
        adminId: string,
        storeId: string,
        dto: AdminStoreRejectRequest,
    ): Promise<AdminStoreActionResponse> {
        const updated = await this.prisma.$transaction((tx) =>
            transitionStore(tx, storeId, StoreStatus.PENDING, {
                status: StoreStatus.REJECTED,
                rejectedReason: dto.rejectedReason,
            }),
        );
        this.log(adminId, storeId, 'reject');

        // P-7: PENDING→REJECTED(검수 반려) 시 파트너에게 알림 (plan §5 P-7, 정책 §5.3)
        // 트랜잭션 커밋 이후 side-effect — 발송 실패가 상태 전이 롤백 유발 금지 (plan §2)
        const partnerUserId = await this.fetchPartnerUserId(updated.partnerId);
        if (partnerUserId) {
            await this.notificationService.createAndDispatch({
                recipientId: partnerUserId,
                eventType: 'P-7',
                category: NotificationCategory.OPERATION,
                title: '공방 검수 반려',
                body: '공방 검수가 반려됐어요. 사유를 확인하세요.',
                deepLink: `/partner`,
                idempotencyKey: `P-7:${storeId}:${partnerUserId}`,
            });
        }

        return actionResponse(updated);
    }
}

@Injectable()
export class SuspendStoreUseCase extends StoreActionUseCase {
    constructor(prisma: PrismaService, notificationService: NotificationService) {
        super(prisma, notificationService);
    }

    async execute(
        adminId: string,
        storeId: string,
        dto: AdminStoreSuspendRequest,
    ): Promise<AdminStoreActionResponse> {
        const updated = await this.prisma.$transaction((tx) =>
            transitionStore(tx, storeId, StoreStatus.PUBLISHED, {
                status: StoreStatus.SUSPENDED,
                suspendedReason: dto.suspendedReason,
            }),
        );
        this.log(adminId, storeId, 'suspend');

        // P-8: PUBLISHED→SUSPENDED(노출 중단) 시 파트너에게 알림 (plan §5 P-8, 정책 §5.3)
        // 트랜잭션 커밋 이후 side-effect — 발송 실패가 상태 전이 롤백 유발 금지 (plan §2)
        const partnerUserId = await this.fetchPartnerUserId(updated.partnerId);
        if (partnerUserId) {
            await this.notificationService.createAndDispatch({
                recipientId: partnerUserId,
                eventType: 'P-8',
                category: NotificationCategory.OPERATION,
                title: '공방 노출 중단',
                body: '공방 노출이 중단됐어요.',
                deepLink: `/partner`,
                idempotencyKey: `P-8:${storeId}:${partnerUserId}`,
            });
        }

        return actionResponse(updated);
    }
}

@Injectable()
export class RestoreStoreUseCase extends StoreActionUseCase {
    constructor(prisma: PrismaService, notificationService: NotificationService) {
        super(prisma, notificationService);
    }

    async execute(adminId: string, storeId: string): Promise<AdminStoreActionResponse> {
        const updated = await this.prisma.$transaction((tx) =>
            transitionStore(tx, storeId, StoreStatus.SUSPENDED, {
                status: StoreStatus.PUBLISHED,
                suspendedReason: null,
            }),
        );
        this.log(adminId, storeId, 'restore');
        return actionResponse(updated);
    }
}
