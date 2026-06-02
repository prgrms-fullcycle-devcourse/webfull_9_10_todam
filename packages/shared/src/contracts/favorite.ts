import { z } from 'zod';

// 공방 찜 토글 (POST /stores/:storeId/favorite — body 없음).
export const toggleFavoriteResultSchema = z.object({
    storeId: z.string(),
    isFavorite: z.boolean(),
});
export type ToggleFavoriteResult = z.infer<typeof toggleFavoriteResultSchema>;

// 찜한 공방 목록 (GET /users/me/favorite-stores).
export const favoriteStoreItemSchema = z.object({
    favoriteId: z.string(),
    storeId: z.string(),
    name: z.string(),
    category: z.string(), // D2-b: 카드 카테고리 태그(예 "도자기"). reservation-list.category 와 동일 컨벤션.
    imageUrl: z.string(),
    address: z.string(),
    createdAt: z.string(), // ISO 8601
});
export type FavoriteStoreItem = z.infer<typeof favoriteStoreItemSchema>;

export const favoriteStoreListResultSchema = z.object({
    favoriteStores: z.array(favoriteStoreItemSchema),
    nextCursor: z.string().nullable(),
});
export type FavoriteStoreListResult = z.infer<typeof favoriteStoreListResultSchema>;
