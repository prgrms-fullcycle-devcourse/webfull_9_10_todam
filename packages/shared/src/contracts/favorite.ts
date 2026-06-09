import { z } from 'zod';

// 공방 찜 토글 (POST /stores/:storeId/favorite — body 없음).
export const toggleFavoriteResultSchema = z.object({
    storeId: z.string(),
    isFavorite: z.boolean(),
});
export type ToggleFavoriteResult = z.infer<typeof toggleFavoriteResultSchema>;

// 찜한 공방 목록 쿼리 (GET /users/me/favorite-stores?cursor&limit).
// getMyReservationsQuerySchema 스타일을 따른다.
export const favoriteStoresQuerySchema = z.object({
    cursor: z
        .string()
        .meta({
            description: '이전 응답의 nextCursor (opaque base64url)',
            example: 'eyJjcmVhdGVkQXQi...',
        })
        .optional(),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .meta({ description: '한 번에 가져올 항목 수 (기본 20)', example: 20 })
        .optional(),
});
export type FavoriteStoresQuery = z.infer<typeof favoriteStoresQuerySchema>;

// 찜한 공방 목록 (GET /users/me/favorite-stores).
export const favoriteStoreItemSchema = z.object({
    favoriteId: z.string(),
    storeId: z.string(),
    name: z.string(),
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
