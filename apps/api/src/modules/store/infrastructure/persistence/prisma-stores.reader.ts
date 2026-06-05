import { Injectable } from '@nestjs/common';
import { DayOfWeek, Prisma, ProgramStatus, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import type { ListStoresQueryDto } from '../../presentation/dto/list-stores.dto';
import type {
    ListStoresResponseDto,
    StoreListItemDto,
} from '../../presentation/dto/list-stores-response.dto';
import {
    decodeCursor,
    encodeCursor,
    isDistanceCursor,
    type StoreCursorPayload,
} from './store-cursor';

const DEFAULT_LIMIT = 20;
const EARTH_RADIUS_M = 6_371_000;

// 운영시간 비교는 KST 기준.
const KST_OFFSET_MINUTES = 9 * 60;

const PRISMA_DAY_OF_WEEK: DayOfWeek[] = [
    DayOfWeek.SUN, // getUTCDay()=0
    DayOfWeek.MON,
    DayOfWeek.TUE,
    DayOfWeek.WED,
    DayOfWeek.THU,
    DayOfWeek.FRI,
    DayOfWeek.SAT,
];

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

    async execute(query: ListStoresQueryDto): Promise<ListStoresResponseDto> {
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
    ): Promise<ListStoresResponseDto> {
        const rows = await this.prisma.store.findMany({ where, select: STORE_SELECT });

        type Ranked = { row: StoreRow; distance: number };
        const ranked: Ranked[] = rows
            .map((row) => ({ row, distance: this.distanceMeters(lat, lng, row) }))
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
    ): Promise<ListStoresResponseDto> {
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

    private distanceMeters(lat: number, lng: number, row: StoreRow): number {
        if (row.latitude === null || row.longitude === null) {
            return Number.POSITIVE_INFINITY;
        }
        const toRad = (deg: number): number => (deg * Math.PI) / 180;
        const dLat = toRad(row.latitude - lat);
        const dLng = toRad(row.longitude - lng);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat)) * Math.cos(toRad(row.latitude)) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(EARTH_RADIUS_M * c);
    }

    private toDto(row: StoreRow, distance: number | null, keyword?: string): StoreListItemDto {
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
            isOperating: this.toIsOperating(row.operatingHours),
            publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
            createdAt: row.createdAt.toISOString(),
        };
    }

    private toConvenienceInfo(value: Prisma.JsonValue | null): StoreListItemDto['convenienceInfo'] {
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
    ): StoreListItemDto['representativeClass'] {
        if (programs.length === 0) {
            return null;
        }
        const cheapest = this.cheapest(programs);
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
    ): StoreListItemDto['matchedClass'] {
        if (!keyword) {
            return null;
        }
        const needle = keyword.toLowerCase();
        const matched = programs.filter((p) => p.title.toLowerCase().includes(needle));
        if (matched.length === 0) {
            return null;
        }
        const cheapest = this.cheapest(matched);
        return { name: cheapest.title, price: cheapest.price };
    }

    // 호출 측에서 비어있지 않음을 보장한다(programs.length === 0 가드 후 호출).
    private cheapest(programs: StoreRow['programs']): StoreRow['programs'][number] {
        const sorted = [...programs].sort((a, b) => {
            if (a.price !== b.price) {
                return a.price - b.price;
            }
            if (a.sortOrder !== b.sortOrder) {
                return a.sortOrder - b.sortOrder;
            }
            return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        });
        const first = sorted[0];
        if (!first) {
            throw new Error('cheapest: programs must not be empty');
        }
        return first;
    }

    // 현재 KST 요일·시각이 운영시간 내인지. 휴게시간(breakStart~breakEnd)은 운영 외로 처리.
    private toIsOperating(hours: StoreRow['operatingHours']): boolean {
        const nowKst = new Date(Date.now() + KST_OFFSET_MINUTES * 60 * 1000);
        const day = PRISMA_DAY_OF_WEEK[nowKst.getUTCDay()];
        const nowMinutes = nowKst.getUTCHours() * 60 + nowKst.getUTCMinutes();

        const today = hours.filter((h) => h.dayOfWeek === day);
        if (today.length === 0) {
            return false;
        }

        return today.some((h) => {
            const open = this.timeToMinutes(h.openTime);
            const close = this.timeToMinutes(h.closeTime);
            if (open === null || close === null) {
                return false;
            }
            const withinOpen =
                close > open
                    ? nowMinutes >= open && nowMinutes < close
                    : // 자정 넘김(예: 22:00~02:00)
                      nowMinutes >= open || nowMinutes < close;
            if (!withinOpen) {
                return false;
            }
            const bStart = this.timeToMinutes(h.breakStart);
            const bEnd = this.timeToMinutes(h.breakEnd);
            if (bStart !== null && bEnd !== null && nowMinutes >= bStart && nowMinutes < bEnd) {
                return false; // 휴게시간
            }
            return true;
        });
    }

    // Prisma @db.Time 값은 1970-01-01 기준 Date(UTC)로 들어옴 → 시:분만 추출.
    private timeToMinutes(time: Date | null): number | null {
        if (!time) {
            return null;
        }
        return time.getUTCHours() * 60 + time.getUTCMinutes();
    }
}
