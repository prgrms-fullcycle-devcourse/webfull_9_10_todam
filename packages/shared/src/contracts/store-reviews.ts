import { z } from 'zod';

export const STORE_REVIEWS_PAGE_SIZE = 10;

export const storeReviewPhotoSchema = z.object({
    imageUrl: z.string(),
});
export type StoreReviewPhoto = z.infer<typeof storeReviewPhotoSchema>;

export const storeReviewListItemSchema = z.object({
    id: z.string(),
    nickname: z.string(),
    rating: z.number(),
    content: z.string(),
    photos: z.array(storeReviewPhotoSchema),
    programId: z.string(),
    programTitle: z.string(),
    createdAt: z.string(),
});
export type StoreReviewListItem = z.infer<typeof storeReviewListItemSchema>;

export const storeReviewPageInfoSchema = z.object({
    nextCursor: z.string().nullable(),
    hasNext: z.boolean(),
});
export type StoreReviewPageInfo = z.infer<typeof storeReviewPageInfoSchema>;

export const storeReviewListResultSchema = z.object({
    reviews: z.array(storeReviewListItemSchema),
    pageInfo: storeReviewPageInfoSchema,
});
export type StoreReviewListResult = z.infer<typeof storeReviewListResultSchema>;
