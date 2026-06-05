import { z } from 'zod';

import { StoreStatus } from '../enums/store-status';

// ─── 현재(마지막 접속) 공방 + 소유 공방 목록 ──────────────────────────────
// GET /partner/me/current-store — 전역 currentStore bootstrap·전환시트 용.
export const currentStoreItemSchema = z.object({
    id: z.string().meta({ description: '공방 ID', example: 'store-uuid' }),
    name: z.string().meta({ description: '공방명', example: '흙과 사람' }),
    status: z
        .nativeEnum(StoreStatus)
        .meta({ description: '공방 게시상태', example: StoreStatus.PUBLISHED }),
});
export type CurrentStoreItem = z.infer<typeof currentStoreItemSchema>;

export const getPartnerCurrentStoreResultSchema = z.object({
    lastAccessedStoreId: z
        .string()
        .meta({
            description: '마지막 접속 공방 ID (미설정 시 null)',
            example: 'store-uuid',
        })
        .nullable(),
    stores: z.array(currentStoreItemSchema).meta({ description: '소유 공방 목록 (createdAt asc)' }),
});
export type GetPartnerCurrentStoreResult = z.infer<typeof getPartnerCurrentStoreResultSchema>;

// PATCH /partner/me/current-store — 공방 전환(마지막 접속 공방 갱신).
export const updatePartnerCurrentStoreRequestSchema = z.object({
    storeId: z.string().uuid().meta({
        description: '전환할 공방 ID',
        example: 'store-uuid',
    }),
});
export type UpdatePartnerCurrentStoreRequest = z.infer<
    typeof updatePartnerCurrentStoreRequestSchema
>;

export const updatePartnerCurrentStoreResultSchema = z.object({
    lastAccessedStoreId: z
        .string()
        .meta({ description: '갱신된 lastAccessedStoreId', example: 'store-uuid' }),
});
export type UpdatePartnerCurrentStoreResult = z.infer<typeof updatePartnerCurrentStoreResultSchema>;
