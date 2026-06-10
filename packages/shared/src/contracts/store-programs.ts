import { z } from 'zod';

import { ProgramDifficulty } from '../enums/program-difficulty';
import { ProgramStatus } from '../enums/program-status';

// ─── 파트너센터 운영 클래스 목록 ──────────────────────────────────
// GET /api/v1/partner/stores/{storeId}/programs  (CONTRACT-2 신설)
// API Contract 스냅샷(docs/exec-plans/active/partner-class-list.md) SSOT.
// 퍼블릭 목록과 달리 status enum 전체(DRAFT/ACTIVE/INACTIVE) 포함(파트너 본인 관리 화면).
// 필드 재정합(2026-06-04): thumbnailUrl·sortOrder·createdAt 제거, difficulty·leadTimeDays 추가.
// 최종 8필드: id, title, price, durationMinutes, difficulty, leadTimeDays, deliverable, status.

export const partnerProgramListItemSchema = z.object({
    id: z.string().meta({ example: 'program-uuid-001' }),
    title: z.string().meta({ example: '물레 체험 기초반' }),
    price: z.number().meta({ example: 45000 }),
    durationMinutes: z.number().meta({ example: 120 }),
    // BASIC / INTERMEDIATE / ADVANCED.
    difficulty: z.nativeEnum(ProgramDifficulty).meta({ example: ProgramDifficulty.BASIC }),
    // 작품 수령까지 평균 제작일.
    leadTimeDays: z.number().meta({ example: 30 }),
    // 작품 배송 가능 여부. true면 수동 등록 시 수령방식(택배/직접수령) 선택 가능, false면 PICKUP 강제.
    deliverable: z.boolean().meta({ example: true }),
    // CONTRACT-4: DRAFT(작성 중) / ACTIVE(예약 가능) / INACTIVE(일시 중단).
    status: z.nativeEnum(ProgramStatus).meta({ example: ProgramStatus.ACTIVE }),
});
export type PartnerProgramListItem = z.infer<typeof partnerProgramListItemSchema>;

// 목록 응답 봉투의 data 부분: { programs }. 0개 시 [].
export const partnerProgramListResultSchema = z.object({
    programs: z.array(partnerProgramListItemSchema),
});
export type PartnerProgramListResult = z.infer<typeof partnerProgramListResultSchema>;

// ─── 공개 공방 클래스 목록 ──────────────────────────────────────────
// GET /stores/{slug}/programs — 공개 노출(status ACTIVE 고정). 형태 SSOT = BE 응답(prisma-store-programs.reader).
// 파트너 목록과 달리 description·imageUrl·sortOrder 포함(유저 카드 노출용).
//  - imageUrl: 대표 이미지 없으면 null
export const storeProgramListItemSchema = z.object({
    id: z.string().meta({ example: 'program-uuid-001' }),
    title: z.string().meta({ example: '머그컵 만들기' }),
    difficulty: z.nativeEnum(ProgramDifficulty).meta({ example: ProgramDifficulty.BASIC }),
    description: z.string().meta({ example: '나만의 머그컵을 빚어보는 원데이 클래스' }),
    price: z.number().meta({ example: 45000 }),
    durationMinutes: z.number().meta({ example: 120 }),
    leadTimeDays: z.number().meta({ example: 28 }),
    deliverable: z.boolean().meta({ example: true }),
    imageUrl: z.string().meta({ example: 'https://cdn.todam.example/programs/mug.jpg' }).nullable(),
    status: z.nativeEnum(ProgramStatus).meta({ example: ProgramStatus.ACTIVE }),
    sortOrder: z.number().meta({ example: 1 }),
});
export type StoreProgramListItem = z.infer<typeof storeProgramListItemSchema>;

export const storeProgramListResultSchema = z.object({
    programs: z.array(storeProgramListItemSchema),
});
export type StoreProgramListResult = z.infer<typeof storeProgramListResultSchema>;

// ─── 파트너센터 운영 클래스 순서 변경 ────────────────────────────
// PATCH /api/v1/partner/stores/{storeId}/programs/order  (CONTRACT-2 순서 변경)
// body: { programs: [{ id, sortOrder }] }. 응답은 재정렬된 전체 목록(partnerProgramListResultSchema 재사용).
// 검증: programs[].id 집합이 해당 공방 전체 program 집합과 정확히 일치(누락·중복·타 공방 ID → 400 INVALID_PROGRAM_ORDER).

export const partnerProgramReorderItemSchema = z.object({
    id: z
        .string()
        .uuid('클래스 ID는 UUID 형식이어야 합니다.')
        .meta({ description: '클래스 ID', example: '11111111-1111-1111-1111-111111111111' }),
    sortOrder: z.number().int('sortOrder는 정수여야 합니다.').meta({
        description: '노출 순서(정수)',
        example: 1,
    }),
});
export type PartnerProgramReorderItem = z.infer<typeof partnerProgramReorderItemSchema>;

export const partnerProgramReorderRequestSchema = z.object({
    programs: z
        .array(partnerProgramReorderItemSchema)
        .nonempty('programs 배열은 비어 있을 수 없습니다.'),
});
export type PartnerProgramReorderRequest = z.infer<typeof partnerProgramReorderRequestSchema>;

// ─── 파트너센터 운영 클래스 상세 ──────────────────────────────────
// GET /partner/stores/{storeId}/programs/{programId}  (AuthGuard, PartnerGuard)
// API Contract 스냅샷(docs/exec-plans/completed/partner-class-detail.md) SSOT.
// 퍼블릭 상세(program-edit programDetailSchema)와 달리 이미지가 { imageUrl }만,
// status enum 전체(DRAFT/ACTIVE/INACTIVE) 반환. serve-UPLOADED-only.

export const partnerProgramDetailImageSchema = z.object({
    programImageId: z.string().meta({ example: 'program-image-uuid-001' }),
    imageUrl: z.string().meta({ example: 'https://cdn.todam.app/programs/pottery-01.png' }),
    isThumbnail: z.boolean().meta({ example: true }),
});
export type PartnerProgramDetailImage = z.infer<typeof partnerProgramDetailImageSchema>;

export const partnerProgramDetailSchema = z.object({
    id: z.string().meta({ example: 'program-uuid-001' }),
    storeId: z.string().meta({ example: 'store-uuid-001' }),
    title: z.string().meta({ example: '물레 체험 기초반' }),
    description: z
        .string()
        .meta({ example: '처음 도자기를 접하는 분들을 위한 물레 체험입니다.' })
        .nullable(),
    materials: z.string().meta({ example: '앞치마 (공방 제공), 편한 복장' }).nullable(),
    caution: z.string().meta({ example: '체험 당일 취소는 불가합니다.' }).nullable(),
    price: z.number().meta({ example: 45000 }),
    durationMinutes: z.number().meta({ example: 120 }),
    leadTimeDays: z.number().meta({ example: 30 }),
    deliverable: z.boolean().meta({ example: true }),
    childFriendly: z.boolean().meta({ example: false }),
    difficulty: z.nativeEnum(ProgramDifficulty).meta({ example: ProgramDifficulty.BASIC }),
    status: z.nativeEnum(ProgramStatus).meta({ example: ProgramStatus.ACTIVE }),
    images: z.array(partnerProgramDetailImageSchema),
});
export type PartnerProgramDetail = z.infer<typeof partnerProgramDetailSchema>;

// 상세 응답 봉투의 data 부분: { program }.
export const partnerProgramDetailResultSchema = z.object({
    program: partnerProgramDetailSchema,
});
export type PartnerProgramDetailResult = z.infer<typeof partnerProgramDetailResultSchema>;
