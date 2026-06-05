import { z } from 'zod';

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
