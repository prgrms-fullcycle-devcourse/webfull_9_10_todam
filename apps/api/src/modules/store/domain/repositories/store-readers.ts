export interface ListStoresQuery {
    lat?: number;
    lng?: number;
    keyword?: string;
    cursor?: string;
    limit?: number;
}

export interface StoreListItem {
    id: string;
    partnerId: string;
    slug: string;
    name: string;
    description: string;
    phone: string;
    address: string;
    status: `${StoreStatus}`;
    convenienceInfo: { parking: boolean; pet: boolean; wifi: boolean };
    autoConfirm: boolean;
    region: { sido: string | null; sigungu: string | null; dong: string | null };
    thumbnailUrl: string | null;
    rating: number | null;
    reviewCount: number;
    distance: number | null;
    representativeClass: { name: string; price: number; hasMore: boolean } | null;
    matchedClass: { name: string; price: number } | null;
    isOperating: boolean;
    publishedAt: string;
    createdAt: string;
}

export interface ListStoresResult {
    stores: StoreListItem[];
    pageInfo: { nextCursor: string | null; hasNext: boolean };
}

export type StoreReviewSort = 'latest' | 'rating_high';

export interface ListStoreReviewsQuery {
    cursor?: string;
    limit?: number;
    sort?: StoreReviewSort;
}

export interface StoreReviewListItem {
    id: string;
    nickname: string;
    rating: number;
    content: string;
    photos: { imageUrl: string; thumbnailUrl: string }[];
    programTitle: string;
    createdAt: string;
}

export interface ListStoreReviewsResult {
    reviews: StoreReviewListItem[];
    pageInfo: { nextCursor: string | null; hasNext: boolean };
}

export interface StoreSuggestion {
    type: 'REGION' | 'PROGRAM' | 'STORE';
    id: string;
    text: string;
    subtitle: string | null;
}

export interface AutocompleteStoresResult {
    suggestions: StoreSuggestion[];
}

// 응답 형태 SSOT = @todam/shared(zod). infra(Prisma reader)가 경계에서 Prisma enum → shared enum 매핑.
// 타입 정의는 하단 @todam/shared import 블록에서 가져와 재노출(export type).
export type { PartnerOnboardingResult };

export interface PartnerStoreDetailResult {
    store: {
        id: string;
        partnerId: string;
        name: string;
        slug: string;
        description: string | null;
        phone: string | null;
        address: string | null;
        latitude: number | null;
        longitude: number | null;
        convenienceInfo: { parking: boolean; pet: boolean; wifi: boolean };
        autoConfirm: boolean;
        cancelDeadlineDays: number | null;
        reservationIntervalMinutes: number;
        maxCapacityPerSlot: number;
        status: `${StoreStatus}`;
        rejectedReason: string | null;
        suspendedReason: string | null;
        rating: number;
        reviewCount: number;
        inProgressReservationCount: number;
        operatingHours: {
            dayOfWeek: string;
            openTime: string;
            closeTime: string;
            breakStart: string | null;
            breakEnd: string | null;
        }[];
        images: {
            id: string;
            imageUrl: string;
            thumbnailUrl: string | null;
            isThumbnail: boolean;
            sortOrder: number;
        }[];
        businessDocument: {
            ownerName: string;
            email: string | null;
            businessName: string;
            businessNumber: string;
            businessAddress: string;
            ocrStatus: `${OcrStatus}` | null;
        } | null;
        publishedAt: string | null;
        createdAt: string;
    };
}

export interface PublicStoreDetailResult {
    store: {
        id: string;
        partnerId: string;
        slug: string;
        name: string;
        description: string;
        phone: string;
        address: string;
        status: `${StoreStatus}`;
        convenienceInfo: { parking: boolean; pet: boolean; wifi: boolean };
        autoConfirm: boolean;
        publishedAt: string;
        images: { imageUrl: string; thumbnailUrl: string | null }[];
        rating: number | null;
        reviewCount: number;
        location: { lat: number; lng: number };
        isFavorite: boolean;
    };
}

export type PartnerStoresResult = PartnerDashboardStoresResult;

export interface StoreProgramsResult {
    programs: {
        id: string;
        title: string;
        difficulty: `${ProgramDifficulty}`;
        description: string;
        price: number;
        durationMinutes: number;
        leadTimeDays: number;
        deliverable: boolean;
        thumbnailUrl: string | null;
        status: `${ProgramStatus}`;
        sortOrder: number;
    }[];
}

export interface SlugAvailabilityResult {
    slug: string;
    available: boolean;
}

export abstract class AutocompleteStoresReader {
    abstract execute(keyword: string | undefined): Promise<AutocompleteStoresResult>;
}

export abstract class PartnerOnboardingReader {
    abstract execute(userId: string): Promise<PartnerOnboardingResult>;
}

export abstract class PartnerStoreDetailReader {
    abstract execute(userId: string, storeId: string): Promise<PartnerStoreDetailResult>;
}

export abstract class SlugAvailabilityReader {
    abstract execute(
        userId: string,
        slug: string | undefined,
        excludeStoreId?: string,
    ): Promise<SlugAvailabilityResult>;
}

export abstract class StoreDetailReader {
    abstract execute(slug: string, userId?: string): Promise<PublicStoreDetailResult>;
}

export abstract class PartnerStoresReader {
    abstract execute(userId: string): Promise<PartnerStoresResult>;
}

export abstract class StoreProgramsReader {
    abstract execute(slug: string): Promise<StoreProgramsResult>;
}

export abstract class StoreReviewsReader {
    abstract execute(slug: string, query: ListStoreReviewsQuery): Promise<ListStoreReviewsResult>;
}

export abstract class StoresReader {
    abstract execute(query: ListStoresQuery): Promise<ListStoresResult>;
}

// ─── 찜한 공방 목록 (GET /users/me/favorite-stores) ──────────────────────────
export interface ListFavoriteStoresQuery {
    userId: string;
    cursor?: string;
    limit: number;
}

export interface FavoriteStoreListItem {
    favoriteId: string;
    storeId: string;
    name: string;
    imageUrl: string;
    address: string;
    createdAt: string; // ISO 8601
}

export interface ListFavoriteStoresResult {
    favoriteStores: FavoriteStoreListItem[];
    nextCursor: string | null;
}

export abstract class FavoriteStoresReader {
    abstract execute(query: ListFavoriteStoresQuery): Promise<ListFavoriteStoresResult>;
}

import type {
    OcrStatus,
    PartnerDashboardStoresResult,
    PartnerOnboardingResult,
    ProgramDifficulty,
    ProgramStatus,
    StoreStatus,
} from '@todam/shared';
