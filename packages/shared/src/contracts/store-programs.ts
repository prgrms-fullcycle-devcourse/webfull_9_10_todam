import { z } from 'zod';

import { ProgramDifficulty } from '../enums/program-difficulty';
import { ProgramStatus } from '../enums/program-status';

// ─── 파트너센터 운영 클래스 목록 ──────────────────────────────────
// GET /api/v1/partner/stores/{storeId}/programs  (CONTRACT-2 신설)
// API Contract 스냅샷(docs/exec-plans/active/partner-class-list.md) SSOT.
// 퍼블릭 목록과 달리 status enum 전체(DRAFT/ACTIVE/INACTIVE) 포함(파트너 본인 관리 화면).
// 필드 재정합(2026-06-04): thumbnailUrl·sortOrder·createdAt 제거, difficulty·leadTimeDays 추가.
// 최종 7필드: id, title, price, durationMinutes, difficulty, leadTimeDays, status.

export const partnerProgramListItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    price: z.number(),
    durationMinutes: z.number(),
    // BASIC / INTERMEDIATE / ADVANCED.
    difficulty: z.nativeEnum(ProgramDifficulty),
    // 작품 수령까지 평균 제작일.
    leadTimeDays: z.number(),
    // CONTRACT-4: DRAFT(작성 중) / ACTIVE(예약 가능) / INACTIVE(일시 중단).
    status: z.nativeEnum(ProgramStatus),
});
export type PartnerProgramListItem = z.infer<typeof partnerProgramListItemSchema>;

// 목록 응답 봉투의 data 부분: { programs }. 0개 시 [].
export const partnerProgramListResultSchema = z.object({
    programs: z.array(partnerProgramListItemSchema),
});
export type PartnerProgramListResult = z.infer<typeof partnerProgramListResultSchema>;

// ─── 파트너센터 운영 클래스 순서 변경 ────────────────────────────
// PATCH /api/v1/partner/stores/{storeId}/programs/order  (CONTRACT-2 순서 변경)
// body: { programs: [{ id, sortOrder }] }. 응답은 재정렬된 전체 목록(partnerProgramListResultSchema 재사용).
// 검증: programs[].id 집합이 해당 공방 전체 program 집합과 정확히 일치(누락·중복·타 공방 ID → 400 INVALID_PROGRAM_ORDER).

export const partnerProgramReorderItemSchema = z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
});
export type PartnerProgramReorderItem = z.infer<typeof partnerProgramReorderItemSchema>;

export const partnerProgramReorderRequestSchema = z.object({
    programs: z.array(partnerProgramReorderItemSchema).nonempty(),
});
export type PartnerProgramReorderRequest = z.infer<typeof partnerProgramReorderRequestSchema>;
