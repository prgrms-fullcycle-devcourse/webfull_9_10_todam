import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type { SlugAvailabilityResponseDto } from '../../presentation/dto/slug-availability.dto';

// shared runtime import는 API Jest ESM 변환 설정 정비 전까지 사용할 수 없다.
const SLUG_PATTERN = /^[a-z0-9-]{4,40}$/;

@Injectable()
export class PrismaSlugAvailabilityReader {
    constructor(private readonly prisma: PrismaService) {}

    async execute(
        userId: string,
        rawSlug: string | undefined,
        excludeStoreId?: string,
    ): Promise<SlugAvailabilityResponseDto> {
        const slug = rawSlug?.trim();

        // slug 누락 / 형식 위반(4~40·하이픈만) → 400 BAD_REQUEST (contract error 코드 정합)
        if (!slug || !SLUG_PATTERN.test(slug)) {
            throw new BusinessException(
                'BAD_REQUEST',
                'slug는 영문 소문자·숫자·하이픈, 4~40자여야 합니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // excludeStoreId 지정 시: 해당 store 존재 + 본인 소유 검증. 미존재/타인이면 404.
        // 본인 store의 현재 slug와 동일하면 충돌로 보지 않음(available: true).
        if (excludeStoreId) {
            const excludeStore = await this.prisma.store.findUnique({
                where: { id: excludeStoreId },
                select: { slug: true, partner: { select: { userId: true } } },
            });

            if (!excludeStore || excludeStore.partner.userId !== userId) {
                throw new BusinessException(
                    'NOT_FOUND',
                    '공방을 찾을 수 없습니다.',
                    HttpStatus.NOT_FOUND,
                );
            }

            // 본인 현재 slug면 그대로 사용 가능 — 점유 검사 생략.
            if (excludeStore.slug === slug) {
                return { slug, available: true };
            }
        }

        // 동일 slug를 가진 store가 존재하면(본인 제외) 사용 불가.
        const existing = await this.prisma.store.findUnique({
            where: { slug },
            select: { id: true },
        });

        const available = !existing || existing.id === excludeStoreId;

        return { slug, available };
    }
}
