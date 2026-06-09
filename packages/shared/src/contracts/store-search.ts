import { z } from 'zod';

// ─── 공방 검색 (유저) ──────────────────────────────────────────────
// contract: docs/exec-plans/active/user-stores-keyword.md — API Contract 스냅샷

// ──── GET /stores — keyword 확장 (A) ─────────────────────────────
// region 구조화 (시/구/동) — 기존 string에서 객체로 변경.
export const storeRegionSchema = z.object({
    sido: z.string().nullable(),
    sigungu: z.string().nullable(),
    dong: z.string().nullable(),
});
export type StoreRegion = z.infer<typeof storeRegionSchema>;

export const representativeClassSchema = z.object({
    name: z.string(),
    price: z.number(),
    hasMore: z.boolean(),
});
export type RepresentativeClass = z.infer<typeof representativeClassSchema>;

export const matchedClassSchema = z
    .object({
        name: z.string(),
        price: z.number(),
    })
    .nullable();
export type MatchedClass = z.infer<typeof matchedClassSchema>;

export const storeListItemSchema = z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    region: storeRegionSchema,
    // BE list-stores-response.dto 기준 nullable (썸네일 없음 / 리뷰0건 rating=null / 위치 미제공 distance=null)
    thumbnailUrl: z.string().nullable(),
    rating: z.number().nullable(),
    reviewCount: z.number(),
    distance: z.number().nullable(),
    representativeClass: representativeClassSchema.nullable(),
    matchedClass: matchedClassSchema,
    isOperating: z.boolean(),
});
export type StoreListItem = z.infer<typeof storeListItemSchema>;

export const storeListPageInfoSchema = z.object({
    nextCursor: z.string().nullable(),
    hasNext: z.boolean(),
});
export type StoreListPageInfo = z.infer<typeof storeListPageInfoSchema>;

export const storeListResultSchema = z.object({
    stores: z.array(storeListItemSchema),
    pageInfo: storeListPageInfoSchema,
});
export type StoreListResult = z.infer<typeof storeListResultSchema>;

// ──── GET /stores/search/autocomplete — 자동완성 (B) ─────────────
// type: REGION | STORE | PROGRAM
export const suggestionTypeSchema = z.enum(['REGION', 'STORE', 'PROGRAM']);
export type SuggestionType = z.infer<typeof suggestionTypeSchema>;

export const suggestionSchema = z.object({
    type: suggestionTypeSchema,
    id: z.string(),
    text: z.string(),
    subtitle: z.string().nullable(),
});
export type Suggestion = z.infer<typeof suggestionSchema>;

export const autocompleteResultSchema = z.object({
    suggestions: z.array(suggestionSchema),
});
export type AutocompleteResult = z.infer<typeof autocompleteResultSchema>;

// autocomplete 에러코드
export const AUTOCOMPLETE_ERROR_CODES = {
    KEYWORD_REQUIRED: 'KEYWORD_REQUIRED',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
