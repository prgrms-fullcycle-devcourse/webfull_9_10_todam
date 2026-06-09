import { Injectable } from '@nestjs/common';
import { Prisma, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import type {
    FavoriteStoreListItem,
    ListFavoriteStoresQuery,
    ListFavoriteStoresResult,
} from '../../domain/repositories/store-readers';
import {
    decodeOpaqueCursor,
    encodeOpaqueCursor,
} from '../../../../common/pagination/opaque-cursor.util';

// ─── 찜한 공방 목록 커서 페이로드 ────────────────────────────────────────────
// 정렬키: createdAt desc, id desc (최신 찜순 + id tie-break)
interface FavoriteStoreCursorPayload {
    createdAt: string; // ISO 8601
    id: string; // FavoriteStore.id
}

function encodeFavoriteCursor(payload: FavoriteStoreCursorPayload): string {
    return encodeOpaqueCursor(payload);
}

function decodeFavoriteCursor(cursor: string): FavoriteStoreCursorPayload | null {
    const parsed = decodeOpaqueCursor(cursor);
    if (!parsed || typeof parsed.createdAt !== 'string' || typeof parsed.id !== 'string') {
        return null;
    }
    return { createdAt: parsed.createdAt, id: parsed.id };
}

// Prisma select 결과 형태.
type FavoriteStoreRow = Prisma.FavoriteStoreGetPayload<{
    select: {
        id: true;
        createdAt: true;
        store: {
            select: {
                id: true;
                name: true;
                address: true;
                images: {
                    select: {
                        thumbnailUrl: true;
                        imageUrl: true;
                        sortOrder: true;
                        isThumbnail: true;
                    };
                };
            };
        };
    };
}>;

const FAVORITE_STORE_SELECT = {
    id: true,
    createdAt: true,
    store: {
        select: {
            id: true,
            name: true,
            address: true,
            images: {
                select: {
                    thumbnailUrl: true,
                    imageUrl: true,
                    sortOrder: true,
                    isThumbnail: true,
                },
            },
        },
    },
} satisfies Prisma.FavoriteStoreSelect;

@Injectable()
export class PrismaFavoriteStoresReader {
    constructor(private readonly prisma: PrismaService) {}

    async execute(query: ListFavoriteStoresQuery): Promise<ListFavoriteStoresResult> {
        const { userId, limit } = query;

        // 잘못된 커서는 무시하고 처음부터 조회(plan contract).
        const cursor = query.cursor ? decodeFavoriteCursor(query.cursor) : null;

        const where: Prisma.FavoriteStoreWhereInput = {
            userId,
            store: { status: StoreStatus.PUBLISHED },
        };

        // keyset 페이지네이션: (createdAt desc, id desc) 기준 커서 이후 항목
        if (cursor) {
            const cursorDate = new Date(cursor.createdAt);
            where.AND = [
                {
                    OR: [
                        { createdAt: { lt: cursorDate } },
                        { createdAt: cursorDate, id: { lt: cursor.id } },
                    ],
                },
            ];
        }

        const rows = await this.prisma.favoriteStore.findMany({
            where,
            select: FAVORITE_STORE_SELECT,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: limit + 1, // limit+1 조회 → nextCursor 판정
        });

        const hasNext = rows.length > limit;
        const page = hasNext ? rows.slice(0, limit) : rows;
        const last = page[page.length - 1];
        const nextCursor =
            hasNext && last
                ? encodeFavoriteCursor({
                      createdAt: last.createdAt.toISOString(),
                      id: last.id,
                  })
                : null;

        return {
            favoriteStores: page.map((row) => this.toDto(row)),
            nextCursor,
        };
    }

    // prisma-stores.reader.ts 의 toThumbnailUrl 규칙과 동일:
    // isThumbnail 우선 → sortOrder asc → thumbnailUrl ?? imageUrl
    // 이미지 없으면 '' (빈 문자열, plan contract)
    private toThumbnailUrl(images: FavoriteStoreRow['store']['images']): string {
        if (images.length === 0) {
            return '';
        }
        const sorted = [...images].sort((a, b) => {
            if (a.isThumbnail !== b.isThumbnail) {
                return a.isThumbnail ? -1 : 1;
            }
            return a.sortOrder - b.sortOrder;
        });
        const picked = sorted[0];
        if (!picked) {
            return '';
        }
        return picked.thumbnailUrl ?? picked.imageUrl ?? '';
    }

    private toDto(row: FavoriteStoreRow): FavoriteStoreListItem {
        return {
            favoriteId: row.id,
            storeId: row.store.id,
            name: row.store.name ?? '',
            imageUrl: this.toThumbnailUrl(row.store.images),
            address: row.store.address ?? '',
            createdAt: row.createdAt.toISOString(),
        };
    }
}
