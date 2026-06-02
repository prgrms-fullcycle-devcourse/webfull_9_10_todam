import { z } from 'zod';

// 찜 토글 (고객). POST /stores/:storeId/like { liked } → 결과 상태 반환.
export const toggleLikeRequestSchema = z.object({
    liked: z.boolean(),
});
export type ToggleLikeRequest = z.infer<typeof toggleLikeRequestSchema>;

export const toggleLikeResultSchema = z.object({
    storeId: z.string(),
    liked: z.boolean(),
});
export type ToggleLikeResult = z.infer<typeof toggleLikeResultSchema>;
