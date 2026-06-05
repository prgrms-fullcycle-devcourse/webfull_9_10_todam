import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type {
    ListStoreReviewsQueryDto,
    StoreReviewSort,
} from '../../presentation/dto/list-store-reviews.dto';
import type {
    ListStoreReviewsResponseDto,
    StoreReviewListItemDto,
} from '../../presentation/dto/list-store-reviews-response.dto';
import {
    decodeReviewCursor,
    encodeReviewCursor,
    isRatingHighCursor,
    type ReviewCursorPayload,
} from './store-reviews-cursor';

const DEFAULT_LIMIT = 10;
const DEFAULT_SORT: StoreReviewSort = 'latest';

// Prisma select 결과 형태.
type ReviewRow = Prisma.ReviewGetPayload<{
    select: {
        id: true;
        rating: true;
        content: true;
        createdAt: true;
        user: { select: { nickname: true } };
        reservation: { select: { program: { select: { title: true } } } };
        photos: {
            select: { imageUrl: true; thumbnailUrl: true; sortOrder: true; id: true };
        };
    };
}>;

const REVIEW_SELECT = {
    id: true,
    rating: true,
    content: true,
    createdAt: true,
    user: { select: { nickname: true } },
    reservation: { select: { program: { select: { title: true } } } },
    photos: {
        select: { imageUrl: true, thumbnailUrl: true, sortOrder: true, id: true },
    },
} satisfies Prisma.ReviewSelect;

@Injectable()
export class PrismaStoreReviewsReader {
    constructor(private readonly prisma: PrismaService) {}

    async execute(
        slug: string,
        query: ListStoreReviewsQueryDto,
    ): Promise<ListStoreReviewsResponseDto> {
        const limit = query.limit ?? DEFAULT_LIMIT;
        const sort = query.sort ?? DEFAULT_SORT;

        // slug 로 PUBLISHED 공방 조회. 미존재/비공개(PUBLISHED 외) → 404.
        const store = await this.prisma.store.findUnique({
            where: { slug },
            select: { id: true, status: true },
        });
        if (!store || store.status !== StoreStatus.PUBLISHED) {
            throw new BusinessException(
                'STORE_NOT_FOUND',
                '공방을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        const cursor = query.cursor ? decodeReviewCursor(query.cursor) : null;

        const where: Prisma.ReviewWhereInput = {
            storeId: store.id,
            isVisible: true,
        };
        const cursorWhere = this.toCursorWhere(sort, cursor);
        if (cursorWhere) {
            where.AND = [cursorWhere];
        }

        const orderBy: Prisma.ReviewOrderByWithRelationInput[] =
            sort === 'rating_high'
                ? [{ rating: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }]
                : [{ createdAt: 'desc' }, { id: 'desc' }];

        const rows = await this.prisma.review.findMany({
            where,
            select: REVIEW_SELECT,
            orderBy,
            take: limit + 1,
        });

        const hasNext = rows.length > limit;
        const page = hasNext ? rows.slice(0, limit) : rows;
        const last = page[page.length - 1];
        const nextCursor = hasNext && last ? encodeReviewCursor(this.toCursor(sort, last)) : null;

        return {
            reviews: page.map((row) => this.toDto(row)),
            pageInfo: { nextCursor, hasNext },
        };
    }

    // 커서 이후 항목 조건. 정렬키가 desc 이므로 "이후"는 더 작은 키(동키는 id 더 작은 것).
    private toCursorWhere(
        sort: StoreReviewSort,
        cursor: ReviewCursorPayload | null,
    ): Prisma.ReviewWhereInput | null {
        if (!cursor) {
            return null;
        }

        if (sort === 'rating_high') {
            if (!isRatingHighCursor(cursor)) {
                return null; // 정렬 전환 시 cursor 불일치 → 무시(첫 페이지처럼 동작)
            }
            const cursorDate = new Date(cursor.createdAt);
            return {
                OR: [
                    { rating: { lt: cursor.rating } },
                    {
                        rating: cursor.rating,
                        OR: [
                            { createdAt: { lt: cursorDate } },
                            { createdAt: cursorDate, id: { lt: cursor.id } },
                        ],
                    },
                ],
            };
        }

        // latest
        if (isRatingHighCursor(cursor)) {
            return null;
        }
        const cursorDate = new Date(cursor.createdAt);
        return {
            OR: [
                { createdAt: { lt: cursorDate } },
                { createdAt: cursorDate, id: { lt: cursor.id } },
            ],
        };
    }

    private toCursor(sort: StoreReviewSort, row: ReviewRow): ReviewCursorPayload {
        if (sort === 'rating_high') {
            return {
                rating: row.rating,
                createdAt: row.createdAt.toISOString(),
                id: row.id,
            };
        }
        return { createdAt: row.createdAt.toISOString(), id: row.id };
    }

    private toDto(row: ReviewRow): StoreReviewListItemDto {
        return {
            id: row.id,
            nickname: this.maskNickname(row.user.nickname),
            rating: row.rating,
            content: row.content ?? '',
            photos: this.toPhotos(row.photos),
            programTitle: row.reservation.program.title,
            createdAt: row.createdAt.toISOString(),
        };
    }

    private toPhotos(photos: ReviewRow['photos']): StoreReviewListItemDto['photos'] {
        return [...photos]
            .sort((a, b) => {
                if (a.sortOrder !== b.sortOrder) {
                    return a.sortOrder - b.sortOrder;
                }
                return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
            })
            .map((p) => ({
                imageUrl: p.imageUrl,
                // thumbnailUrl 미설정 시 원본으로 대체(목록에서 깨진 링크 방지).
                thumbnailUrl: p.thumbnailUrl ?? p.imageUrl,
            }));
    }

    // 작성자명 마스킹: 앞 3글자만 노출, 나머지는 길이만큼 '*'.
    // 3글자 이하면 첫 글자만 노출하고 나머지 '*' (최소 1개). 빈 문자열이면 '*'.
    private maskNickname(nickname: string): string {
        const name = nickname ?? '';
        if (name.length === 0) {
            return '*';
        }
        if (name.length <= 3) {
            const visible = name.slice(0, 1);
            return visible + '*'.repeat(Math.max(name.length - 1, 1));
        }
        const visible = name.slice(0, 3);
        return visible + '*'.repeat(name.length - 3);
    }
}
