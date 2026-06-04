import { z } from 'zod';

import { ProgramStatus } from '../enums/program-status';

// ─── 파트너센터 운영 클래스 목록 ──────────────────────────────────
// GET /api/v1/partner/stores/{storeId}/programs  (CONTRACT-2 신설)
// API Contract 스냅샷(docs/exec-plans/active/공방-상세-조회.md) SSOT.
// 퍼블릭 목록과 달리 status enum 전체(DRAFT/ACTIVE/INACTIVE) 포함.

export const partnerProgramListItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    // CONTRACT-4: DRAFT(작성 중) / ACTIVE(예약 가능) / INACTIVE(일시 중단).
    status: z.nativeEnum(ProgramStatus),
    // BE는 대표 이미지 미존재 시 null 반환 → nullable로 맞춤.
    thumbnailUrl: z.string().nullable(),
    price: z.number(),
    durationMinutes: z.number(),
    // 노출 순서. BE가 sortOrder asc 선정렬해 반환하므로 응답 필드로는 미포함 → optional.
    sortOrder: z.number().optional(),
    createdAt: z.string(),
});
export type PartnerProgramListItem = z.infer<typeof partnerProgramListItemSchema>;

// 목록 응답 봉투의 data 부분: { programs }. 0개 시 [].
export const partnerProgramListResultSchema = z.object({
    programs: z.array(partnerProgramListItemSchema),
});
export type PartnerProgramListResult = z.infer<typeof partnerProgramListResultSchema>;
