import { HttpStatus, Injectable } from '@nestjs/common';
import { ImageUploadStatus, Prisma, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type { PublicStoreDetailResult } from '../../domain/repositories/store-readers';

function toConvenienceInfo(value: Prisma.JsonValue | null): {
    parking: boolean;
    pet: boolean;
    wifi: boolean;
} {
    const obj =
        value && typeof value === 'object' && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {};
    return {
        parking: obj.parking === true,
        pet: obj.pet === true,
        wifi: obj.wifi === true,
    };
}

@Injectable()
export class PrismaStoreDetailReader {
    constructor(private readonly prisma: PrismaService) {}

    // userId 가 있으면(선택 인증) 찜 여부를 반영, 없으면 isFavorite=false.
    async execute(slug: string, userId?: string): Promise<PublicStoreDetailResult> {
        const store = await this.prisma.store.findUnique({
            where: { slug },
            select: {
                id: true,
                partnerId: true,
                slug: true,
                name: true,
                description: true,
                phone: true,
                address: true,
                status: true,
                convenienceInfo: true,
                autoConfirm: true,
                latitude: true,
                longitude: true,
                publishedAt: true,
                images: {
                    // S3 업로드 확인(UPLOADED)된 이미지만 노출. PENDING/FAILED 는 깨진 링크가 된다.
                    where: { status: ImageUploadStatus.UPLOADED },
                    orderBy: { sortOrder: 'asc' },
                    select: { imageUrl: true, thumbnailUrl: true },
                },
                reviews: {
                    where: { isVisible: true },
                    select: { rating: true },
                },
            },
        });

        // 미존재 또는 PUBLISHED 아님(DRAFT/PENDING/REJECTED/SUSPENDED) → 404 STORE_NOT_FOUND.
        if (!store || store.status !== StoreStatus.PUBLISHED) {
            throw new BusinessException(
                'STORE_NOT_FOUND',
                '공방을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 찜 여부: 인증된 유저가 있을 때만 조회. 비인증이면 false.
        let isFavorite = false;
        if (userId) {
            const favorite = await this.prisma.favoriteStore.findUnique({
                where: { userId_storeId: { userId, storeId: store.id } },
                select: { id: true },
            });
            isFavorite = favorite !== null;
        }

        const reviewCount = store.reviews.length;
        const rating =
            reviewCount === 0
                ? null
                : Math.round(
                      (store.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount) * 10,
                  ) / 10;

        return {
            store: {
                id: store.id,
                partnerId: store.partnerId,
                slug: store.slug,
                name: store.name,
                description: store.description ?? '',
                phone: store.phone ?? '',
                address: store.address ?? '',
                status: store.status,
                convenienceInfo: toConvenienceInfo(store.convenienceInfo),
                autoConfirm: store.autoConfirm,
                publishedAt: (store.publishedAt ?? new Date(0)).toISOString(),
                images: store.images.map((image) => ({
                    imageUrl: image.imageUrl,
                    thumbnailUrl: image.thumbnailUrl,
                })),
                rating,
                reviewCount,
                location: {
                    lat: store.latitude ?? 0,
                    lng: store.longitude ?? 0,
                },
                isFavorite,
            },
        };
    }
}
