import { z } from 'zod';

import { StoreStatus } from '../enums/store-status';

// ─── 현재(마지막 접속) 공방 + 소유 공방 목록 ──────────────────────────────
// GET /partner/me/current-store — 전역 currentStore bootstrap·전환시트 용.
export const currentStoreItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: z.nativeEnum(StoreStatus),
});
export type CurrentStoreItem = z.infer<typeof currentStoreItemSchema>;

export const getPartnerCurrentStoreResultSchema = z.object({
    lastAccessedStoreId: z.string().nullable(),
    stores: z.array(currentStoreItemSchema),
});
export type GetPartnerCurrentStoreResult = z.infer<typeof getPartnerCurrentStoreResultSchema>;

// PATCH /partner/me/current-store — 공방 전환(마지막 접속 공방 갱신).
export const updatePartnerCurrentStoreRequestSchema = z.object({
    storeId: z.string().uuid(),
});
export type UpdatePartnerCurrentStoreRequest = z.infer<
    typeof updatePartnerCurrentStoreRequestSchema
>;

export const updatePartnerCurrentStoreResultSchema = z.object({
    lastAccessedStoreId: z.string(),
});
export type UpdatePartnerCurrentStoreResult = z.infer<typeof updatePartnerCurrentStoreResultSchema>;
