import { HttpStatus, Injectable } from '@nestjs/common';
import { ImageUploadStatus, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type { PartnerStoreDetailResult } from '../../domain/repositories/store-readers';

// CONTRACT-3: "진행 중" 예약 = 체험 완료 처리되지 않은 예약 건.
// 체험(방문) 이전 단계인 PENDING/CONFIRMED 만 카운트.
// IN_PROGRESS 이후(SHIPPED/DELIVERED/PICKUP_*)는 이미 체험이 완료된 단계, CANCELED 는 제외.
const IN_PROGRESS_RESERVATION_STATUSES: ReservationStatus[] = [
    ReservationStatus.PENDING,
    ReservationStatus.CONFIRMED,
];

// @db.Time(6) 컬럼은 CreateStoreUseCase 에서 setUTCHours 로 저장되므로 UTC 기준으로 HH:mm 포맷.
function formatTime(value: Date | null): string | null {
    if (!value) return null;
    const hours = value.getUTCHours().toString().padStart(2, '0');
    const minutes = value.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function toConvenienceInfo(value: unknown): PartnerStoreDetailResult['store']['convenienceInfo'] {
    const info = (value ?? {}) as Record<string, unknown>;
    return {
        parking: info.parking === true,
        pet: info.pet === true,
        wifi: info.wifi === true,
    };
}

@Injectable()
export class PrismaPartnerStoreDetailReader {
    constructor(private readonly prisma: PrismaService) {}

    async execute(userId: string, storeId: string): Promise<PartnerStoreDetailResult> {
        // 인증된 사용자의 partner 식별 (status 무관 — 소유권은 아래 store.partnerId 대조로 검증).
        const partner = await this.prisma.partner.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!partner) {
            throw new BusinessException(
                'FORBIDDEN',
                '해당 공방에 대한 접근 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: {
                id: true,
                partnerId: true,
                name: true,
                slug: true,
                description: true,
                phone: true,
                address: true,
                latitude: true,
                longitude: true,
                convenienceInfo: true,
                autoConfirm: true,
                cancelDeadlineDays: true,
                reservationIntervalMinutes: true,
                maxCapacityPerSlot: true,
                status: true,
                rejectedReason: true,
                suspendedReason: true,
                publishedAt: true,
                createdAt: true,
                operatingHours: {
                    select: {
                        dayOfWeek: true,
                        openTime: true,
                        closeTime: true,
                        breakStart: true,
                        breakEnd: true,
                    },
                },
                images: {
                    // S3 업로드 확인(confirm)된 이미지만 노출. PENDING/FAILED 는 객체가 없어 깨진 링크가 된다.
                    where: { status: ImageUploadStatus.UPLOADED },
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        imageUrl: true,
                        isThumbnail: true,
                        sortOrder: true,
                    },
                },
                businessDocs: {
                    orderBy: { createdAt: 'asc' },
                    take: 1,
                    select: {
                        ownerName: true,
                        email: true,
                        businessName: true,
                        businessNumber: true,
                        businessAddress: true,
                        ocrStatus: true,
                    },
                },
            },
        });

        // 미존재·삭제 공방 → 404 (CONTRACT-5)
        if (!store) {
            throw new BusinessException(
                'STORE_NOT_FOUND',
                '공방을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 소유 권한 검증: 토큰 파트너와 공방 partner_id 불일치 → 403
        if (store.partnerId !== partner.id) {
            throw new BusinessException(
                'FORBIDDEN',
                '해당 공방에 대한 접근 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // 집계: rating/reviewCount (review 도메인), inProgressReservationCount (체험 미완료 예약 건수).
        const [reviewAggregate, inProgressReservationCount] = await Promise.all([
            this.prisma.review.aggregate({
                where: { storeId: store.id, isVisible: true },
                _avg: { rating: true },
                _count: { _all: true },
            }),
            this.prisma.reservation.count({
                where: {
                    storeId: store.id,
                    status: { in: IN_PROGRESS_RESERVATION_STATUSES },
                },
            }),
        ]);

        const reviewCount = reviewAggregate._count._all;
        const rating = reviewAggregate._avg.rating ?? 0;
        // DEC-5(개정): 슬롯당 최대 정원은 공방(Store) 단위 저장 필드. 미설정 시 0.
        const maxCapacityPerSlot = store.maxCapacityPerSlot ?? 0;

        const businessDoc = store.businessDocs[0] ?? null;

        return {
            store: {
                id: store.id,
                partnerId: store.partnerId,
                name: store.name,
                slug: store.slug,
                description: store.description,
                phone: store.phone,
                address: store.address,
                latitude: store.latitude,
                longitude: store.longitude,
                convenienceInfo: toConvenienceInfo(store.convenienceInfo),
                autoConfirm: store.autoConfirm,
                cancelDeadlineDays: store.cancelDeadlineDays,
                reservationIntervalMinutes: store.reservationIntervalMinutes ?? 0,
                maxCapacityPerSlot,
                status: store.status,
                rejectedReason: store.rejectedReason,
                suspendedReason: store.suspendedReason,
                rating,
                reviewCount,
                inProgressReservationCount,
                operatingHours: store.operatingHours.map((hour) => ({
                    dayOfWeek: hour.dayOfWeek,
                    openTime: formatTime(hour.openTime) ?? '',
                    closeTime: formatTime(hour.closeTime) ?? '',
                    breakStart: formatTime(hour.breakStart),
                    breakEnd: formatTime(hour.breakEnd),
                })),
                images: store.images.map((image) => ({
                    id: image.id,
                    imageUrl: image.imageUrl,
                    isThumbnail: image.isThumbnail,
                    sortOrder: image.sortOrder,
                })),
                businessDocument: businessDoc
                    ? {
                          ownerName: businessDoc.ownerName,
                          email: businessDoc.email,
                          businessName: businessDoc.businessName,
                          businessNumber: businessDoc.businessNumber,
                          businessAddress: businessDoc.businessAddress,
                          ocrStatus: businessDoc.ocrStatus,
                      }
                    : null,
                publishedAt: store.publishedAt?.toISOString() ?? null,
                createdAt: store.createdAt.toISOString(),
            },
        };
    }
}
