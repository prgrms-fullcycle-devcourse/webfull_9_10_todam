import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type { ToggleFavoriteStoreResponseDto } from '../../presentation/dto/toggle-favorite-store.dto';

@Injectable()
export class ToggleFavoriteStoreUseCase {
    constructor(private readonly prisma: PrismaService) {}

    // 찜 이력 없으면 생성(isFavorite=true), 있으면 삭제(isFavorite=false).
    async execute(userId: string, storeId: string): Promise<ToggleFavoriteStoreResponseDto> {
        // PUBLISHED 공방만 찜 가능. 비존재/비공개(DRAFT/PENDING/REJECTED/SUSPENDED) → 404.
        // (다른 store 퍼블릭 엔드포인트와 동일하게 STORE_NOT_FOUND 로 일관. D4 결정.)
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { id: true, status: true },
        });

        if (!store || store.status !== StoreStatus.PUBLISHED) {
            throw new BusinessException(
                'STORE_NOT_FOUND',
                '공방을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        const existing = await this.prisma.favoriteStore.findUnique({
            where: { userId_storeId: { userId, storeId } },
            select: { id: true },
        });

        if (existing) {
            // 해제: 동시 요청으로 이미 삭제되었을 수 있으므로 P2025(record not found)는 무시.
            try {
                await this.prisma.favoriteStore.delete({
                    where: { userId_storeId: { userId, storeId } },
                });
            } catch (error) {
                if (
                    !(
                        error instanceof Prisma.PrismaClientKnownRequestError &&
                        error.code === 'P2025'
                    )
                ) {
                    throw error;
                }
            }
            return { storeId, isFavorite: false };
        }

        // 등록: 동시 요청으로 이미 생성되었을 수 있으므로 @@unique 위반(P2002)은 등록 성공으로 수렴.
        try {
            await this.prisma.favoriteStore.create({
                data: { userId, storeId },
                select: { id: true },
            });
        } catch (error) {
            if (
                !(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
            ) {
                throw error;
            }
        }
        return { storeId, isFavorite: true };
    }
}
