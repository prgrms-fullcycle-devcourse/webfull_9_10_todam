import { z } from 'zod';

import { StoreStatus } from '../enums/store-status';
import { convenienceInfoSchema } from './store-registration';

// ─── 공방 조회 쿼리 (SSOT) ───────────────────────────────────────────
// @Query 문자열 도착 — 숫자는 z.coerce. unknown 키 strip(기본). BE 컨트롤러
// param ZodValidationPipe(또는 INVALID_QUERY_PARAMETERS 매핑 파이프)가 검증.

// GET /stores — 전부 선택. lat/lng 위치, keyword 통합검색, cursor/limit 페이지네이션.
export const listStoresQuerySchema = z.object({
    lat: z.coerce.number('lat은 유효한 위도(숫자)여야 합니다.').min(-90).max(90).optional(),
    lng: z.coerce.number('lng은 유효한 경도(숫자)여야 합니다.').min(-180).max(180).optional(),
    keyword: z.string().optional(),
    cursor: z.string().optional(),
    limit: z.coerce
        .number()
        .int('limit은 정수여야 합니다.')
        .min(1, 'limit은 1 이상이어야 합니다.')
        .max(100, 'limit은 100 이하여야 합니다.')
        .optional(),
});
export type ListStoresQuery = z.infer<typeof listStoresQuerySchema>;

// GET /stores/:slug/reviews — cursor/limit + 정렬.
export const storeReviewSortSchema = z.enum(['latest', 'rating_high']);
export type StoreReviewSort = z.infer<typeof storeReviewSortSchema>;

export const listStoreReviewsQuerySchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce
        .number()
        .int('limit은 정수여야 합니다.')
        .min(1, 'limit은 1 이상이어야 합니다.')
        .max(100, 'limit은 100 이하여야 합니다.')
        .optional(),
    sort: storeReviewSortSchema.optional(),
});
export type ListStoreReviewsQuery = z.infer<typeof listStoreReviewsQuerySchema>;

// GET /stores/slug-availability — slug 형식 검증은 use-case(BAD_REQUEST) 담당.
// DTO/스키마 단에서는 optional string 으로만 두어 형식 분기를 피한다.
export const slugAvailabilityQuerySchema = z.object({
    slug: z.string().optional(),
    excludeStoreId: z.string().optional(),
});
export type SlugAvailabilityQuery = z.infer<typeof slugAvailabilityQuerySchema>;

// ─── 공개 공방 상세 (GET /stores/:slug 응답, SSOT) ───────────────────
// 형태 SSOT = BE 응답(prisma-store-detail.reader). PUBLISHED 공방만 노출.
//  - images[].thumbnailUrl: 썸네일 미생성 시 null
//  - rating: 노출 리뷰 0건이면 null
export const publicStoreDetailImageSchema = z.object({
    imageUrl: z.string().meta({ example: 'https://cdn.todam.example/stores/todam-jeonju/1.jpg' }),
    thumbnailUrl: z
        .string()
        .meta({ example: 'https://cdn.todam.example/stores/todam-jeonju/1-thumb.jpg' })
        .nullable(),
});
export type PublicStoreDetailImage = z.infer<typeof publicStoreDetailImageSchema>;

export const publicStoreDetailSchema = z.object({
    id: z.string().meta({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' }),
    partnerId: z.string().meta({ example: 'd5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a' }),
    slug: z.string().meta({ example: 'todam-jeonju' }),
    name: z.string().meta({ example: '토담 전주 한옥마을점' }),
    description: z
        .string()
        .meta({ example: '한옥의 고즈넉함 속에서 즐기는 도자기 물레 체험 공방입니다.' }),
    phone: z.string().meta({ example: '063-123-4567' }),
    address: z.string().meta({ example: '전북 전주시 완산구 교동 한옥마을길 12' }),
    status: z.nativeEnum(StoreStatus).meta({ example: StoreStatus.PUBLISHED }),
    convenienceInfo: convenienceInfoSchema,
    autoConfirm: z.boolean().meta({ example: false }),
    publishedAt: z.string().meta({ example: '2026-05-25T10:00:00.000Z' }),
    images: z.array(publicStoreDetailImageSchema),
    rating: z
        .number()
        .meta({ example: 4.9, description: '노출 리뷰 평균 별점. 리뷰 0건이면 null' })
        .nullable(),
    reviewCount: z.number().meta({ example: 248 }),
    location: z.object({
        lat: z.number().meta({ example: 37.5446 }),
        lng: z.number().meta({ example: 127.056 }),
    }),
    isFavorite: z.boolean().meta({ example: false, description: '인증 시 찜 여부, 비인증 false' }),
});
export type PublicStoreDetail = z.infer<typeof publicStoreDetailSchema>;

export const publicStoreDetailResultSchema = z.object({
    store: publicStoreDetailSchema,
});
export type PublicStoreDetailResult = z.infer<typeof publicStoreDetailResultSchema>;
