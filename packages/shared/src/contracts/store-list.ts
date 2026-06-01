import { z } from 'zod';

import { StoreStatus } from '../enums/store-status';

// ─── 내 공방 목록 조회 (파트너센터) ──────────────────────────────
// GET /api/v1/partner/stores — 본인 소유 공방 전체(상태 무관), 최신 생성순.
export const partnerStoreListItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    ownerName: z.string(),
    status: z.nativeEnum(StoreStatus),
    createdAt: z.string(),
});
export type PartnerStoreListItem = z.infer<typeof partnerStoreListItemSchema>;

export const partnerStoreListResultSchema = z.object({
    stores: z.array(partnerStoreListItemSchema),
});
export type PartnerStoreListResult = z.infer<typeof partnerStoreListResultSchema>;
