import { Injectable } from '@nestjs/common';
import { Prisma, ProgramStatus, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { StoreListPolicy } from '../../domain/services/store-list-policy.service';
import type {
    ListStoresQuery,
    ListStoresResult,
    StoreListItem,
} from '../../domain/repositories/store-readers';
import {
    decodeCursor,
    encodeCursor,
    isDistanceCursor,
    type StoreCursorPayload,
} from './store-cursor';

const DEFAULT_LIMIT = 20;
// 거리·집계 계산에 필요한 store 행 형태 (Prisma select 결과).
type StoreRow = Prisma.StoreGetPayload<{
    select: {
        id: true;
        partnerId: true;
        slug: true;
        name: true;
        description: true;
        phone: true;
        address: true;
        status: true;
        convenienceInfo: true;
        autoConfirm: true;
        latitude: true;
        longitude: true;
        regionSido: true;
        regionSigungu: true;
        regionDong: true;
        publishedAt: true;
        createdAt: true;
        images: {
            select: { thumbnailUrl: true; imageUrl: true; sortOrder: true; isThumbnail: true };
        };
        programs: {
            select: { id: true; title: true; price: true; sortOrder: true; status: true };
        };
        operatingHours: {
            select: {
                dayOfWeek: true;
                openTime: true;
                closeTime: true;
                breakStart: true;
                breakEnd: true;
            };
        };
        reviews: { select: { rating: true } };
    };
}>;

const STORE_SELECT = {
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
    regionSido: true,
    regionSigungu: true,
    regionDong: true,
    publishedAt: true,
    createdAt: true,
    images: {
        select: { thumbnailUrl: true, imageUrl: true, sortOrder: true, isThumbnail: true },
    },
    programs: {
        where: { status: ProgramStatus.ACTIVE },
        select: { id: true, title: true, price: true, sortOrder: true, status: true },
    },
    operatingHours: {
        select: {
            dayOfWeek: true,
            openTime: true,
            closeTime: true,
            breakStart: true,
            breakEnd: true,
        },
    },
    reviews: {
        where: { isVisible: true },
        select: { rating: true },
    },
} satisfies Prisma.StoreSelect;

@Injectable()
export class PrismaStoresReader {
    constructor(private readonly prisma: PrismaService) {}

    async execute(query: ListStoresQuery): Promise<ListStoresResult> {
        const limit = query.limit ?? DEFAULT_LIMIT;
        const hasCoords = query.lat !== undefined && query.lng !== undefined;
        const keyword = query.keyword?.trim();

        const where: Prisma.StoreWhereInput = { status: StoreStatus.PUBLISHED };

        // keyword: name/address + ACTIVE Program.title 부분일치 (programs join)
        if (keyword) {
            where.OR = [
                { name: { contains: keyword, mode: 'insensitive' } },
                { address: { contains: keyword, mode: 'insensitive' } },
                {
                    programs: {
                        some: {
                            status: ProgramStatus.ACTIVE,
                            title: { contains: keyword, mode: 'insensitive' },
                        },
                    },
                },
            ];
        }

        const cursor = query.cursor ? decodeCursor(query.cursor) : null;

        if (hasCoords) {
            return this.listByDistance(where, query.lat!, query.lng!, limit, cursor, keyword);
        }
        return this.listByPublishedAt(where, limit, cursor, keyword);
    }

    // lat/lng 있음: 거리순 정렬. DB에서 거리 정렬이 불가하므로 후보 전체를 조회→앱에서 거리 산출·정렬·커서 슬라이스.
    private async listByDistance(
        where: Prisma.StoreWhereInput,
        lat: number,
        lng: number,
        limit: number,
        cursor: StoreCursorPayload | null,
        keyword?: string,
    ): Promise<ListStoresResult> {
        const rows = await this.prisma.store.findMany({ where, select: STORE_SELECT });

        type Ranked = { row: StoreRow; distance: number };
        const ranked: Ranked[] = rows
            .map((row) => ({ row, distance: StoreListPolicy.distanceMeters(lat, lng, row) }))
            // 좌표가 없는 공방은 거리 정렬 불가 → 후순위로 밀되 안정 정렬 위해 Infinity
            .sort((a, b) => {
                if (a.distance !== b.distance) {
                    return a.distance - b.distance;
                }
                return a.row.id < b.row.id ? -1 : a.row.id > b.row.id ? 1 : 0;
            });

        let startIndex = 0;
        if (cursor && isDistanceCursor(cursor)) {
            startIndex = ranked.findIndex(
                (r) =>
                    r.distance > cursor.distance ||
                    (r.distance === cursor.distance && r.row.id > cursor.id),
            );
            if (startIndex === -1) {
                startIndex = ranked.length;
            }
        }

        const page = ranked.slice(startIndex, startIndex + limit);
        const hasNext = startIndex + limit < ranked.length;
        const last = page[page.length - 1];
        const nextCursor =
            hasNext && last ? encodeCursor({ distance: last.distance, id: last.row.id }) : null;

        return {
            stores: page.map(({ row, distance }) => this.toDto(row, distance, keyword)),
            pageInfo: { nextCursor, hasNext },
        };
    }

    // lat/lng 없음: publishedAt desc, id asc + 커서. DB 커서 페이징.
    private async listByPublishedAt(
        where: Prisma.StoreWhereInput,
        limit: number,
        cursor: StoreCursorPayload | null,
        keyword?: string,
    ): Promise<ListStoresResult> {
        const effectiveWhere: Prisma.StoreWhereInput = { ...where };

        if (cursor && !isDistanceCursor(cursor)) {
            const cursorDate = new Date(cursor.publishedAt);
            // (publishedAt, id) 보다 "이후" 항목: publishedAt 내림차순이므로 더 과거이거나 동일시각+id 더 큰 것.
            effectiveWhere.AND = [
                {
                    OR: [
                        { publishedAt: { lt: cursorDate } },
                        { publishedAt: cursorDate, id: { gt: cursor.id } },
                    ],
                },
            ];
        }

        const rows = await this.prisma.store.findMany({
            where: effectiveWhere,
            select: STORE_SELECT,
            orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
            take: limit + 1,
        });

        const hasNext = rows.length > limit;
        const page = hasNext ? rows.slice(0, limit) : rows;
        const last = page[page.length - 1];
        const nextCursor =
            hasNext && last
                ? encodeCursor({
                      publishedAt: (last.publishedAt ?? last.createdAt).toISOString(),
                      id: last.id,
                  })
                : null;

        return {
            stores: page.map((row) => this.toDto(row, null, keyword)),
            pageInfo: { nextCursor, hasNext },
        };
    }

    private toDto(row: StoreRow, distance: number | null, keyword?: string): StoreListItem {
        return {
            id: row.id,
            partnerId: row.partnerId,
            slug: row.slug,
            name: row.name,
            description: row.description ?? '',
            phone: row.phone ?? '',
            address: row.address ?? '',
            status: row.status,
            convenienceInfo: this.toConvenienceInfo(row.convenienceInfo),
            autoConfirm: row.autoConfirm,
            region: {
                sido: row.regionSido,
                sigungu: row.regionSigungu,
                dong: row.regionDong,
            },
            thumbnailUrl: this.toThumbnailUrl(row.images),
            rating: this.toRating(row.reviews),
            reviewCount: row.reviews.length,
            distance: distance === null || !Number.isFinite(distance) ? null : distance,
            representativeClass: this.toRepresentativeClass(row.programs),
            matchedClass: this.toMatchedClass(row.programs, keyword),
            isOperating: StoreListPolicy.isOperating(row.operatingHours),
            publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
            createdAt: row.createdAt.toISOString(),
        };
    }

    private toConvenienceInfo(value: Prisma.JsonValue | null): StoreListItem['convenienceInfo'] {
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

    private toThumbnailUrl(images: StoreRow['images']): string | null {
        if (images.length === 0) {
            return null;
        }
        const sorted = [...images].sort((a, b) => {
            if (a.isThumbnail !== b.isThumbnail) {
                return a.isThumbnail ? -1 : 1;
            }
            return a.sortOrder - b.sortOrder;
        });
        const picked = sorted[0];
        if (!picked) {
            return null;
        }
        return picked.thumbnailUrl ?? picked.imageUrl ?? null;
    }

    private toRating(reviews: StoreRow['reviews']): number | null {
        if (reviews.length === 0) {
            return null;
        }
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return Math.round((sum / reviews.length) * 10) / 10;
    }

    // 노출 가능(ACTIVE) Program 중 최저가. 동가는 sortOrder → id tie-break. hasMore=노출 2개↑.
    private toRepresentativeClass(
        programs: StoreRow['programs'],
    ): StoreListItem['representativeClass'] {
        if (programs.length === 0) {
            return null;
        }
        const cheapest = StoreListPolicy.cheapest(programs);
        return {
            name: cheapest.title,
            price: cheapest.price,
            hasMore: programs.length >= 2,
        };
    }

    // keyword가 ACTIVE 프로그램명에 매칭될 때만 non-null. 다건이면 최저가.
    private toMatchedClass(
        programs: StoreRow['programs'],
        keyword?: string,
    ): StoreListItem['matchedClass'] {
        if (!keyword) {
            return null;
        }
        const needle = keyword.toLowerCase();
        const matched = programs.filter((p) => p.title.toLowerCase().includes(needle));
        if (matched.length === 0) {
            return null;
        }
        const cheapest = StoreListPolicy.cheapest(matched);
        return { name: cheapest.title, price: cheapest.price };
    }
}
