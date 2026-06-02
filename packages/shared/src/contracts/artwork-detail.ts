import { z } from 'zod';

import { ArtworkStatus } from '../enums/artwork-status';

import { displayStateSchema } from './reservation-list';

// ─── 작품 상세 조회 (GET /artworks/{artworkId}) ──────────────────────
// 정본(Notion API명세 DB) 기준. docs/exec-plans/active/유저 예약 - 작품 상세 조회.md
// 의 "API Contract (스냅샷)" 섹션과 1:1로 바인딩한다. 임의 변경 금지.
//
// D1 (이미지 확대 원본): 정본 응답엔 `thumbnailUrl`만 명시. Prisma는 `imageUrl` NOT NULL 보유.
//   본 contract는 `imageUrl`을 optional로 둔다. BE 정본 갱신(필수 전환) 후 required로 전환 예정.
//   FE는 확대보기 시 `imageUrl ?? thumbnailUrl` 폴백.
// D5 (단계별 displayState): 매핑 SSOT는 BE 응답이 직접 제공. FE에서 매핑 로직 작성 금지.
//   `currentStage.displayState`/`timeline[].displayState`를 그대로 렌더만 한다.

/** 단계별 사진. D1: imageUrl optional(BE 정본 갱신 후 required 전환 예정). */
export const artworkPhotoSchema = z.object({
    thumbnailUrl: z.string(),
    imageUrl: z.string().optional(),
});
export type ArtworkPhoto = z.infer<typeof artworkPhotoSchema>;

/** 타임라인 단일 entry (완료/현재/미완료). */
export const artworkTimelineEntrySchema = z.object({
    stage: z.nativeEnum(ArtworkStatus),
    isCompleted: z.boolean(),
    // 현재 단계만 true. 완료/미완료 단계는 미포함 또는 false.
    isCurrent: z.boolean().optional(),
    displayState: displayStateSchema,
    photos: z.array(artworkPhotoSchema),
    // 완료 단계만 존재. 현재/미완료는 미포함.
    completedAt: z.string().optional(),
});
export type ArtworkTimelineEntry = z.infer<typeof artworkTimelineEntrySchema>;

/** 현재 단계. */
export const artworkCurrentStageSchema = z.object({
    status: z.nativeEnum(ArtworkStatus),
    displayState: displayStateSchema,
});
export type ArtworkCurrentStage = z.infer<typeof artworkCurrentStageSchema>;

/** 작품 상세 정본. */
export const artworkDetailSchema = z.object({
    id: z.string(),
    estimatedCompletedAt: z.string().nullable(),
    currentStage: artworkCurrentStageSchema,
    timeline: z.array(artworkTimelineEntrySchema),
});
export type ArtworkDetail = z.infer<typeof artworkDetailSchema>;

/** GET /artworks/{artworkId} 의 data 페이로드. */
export const artworkDetailResultSchema = z.object({
    artwork: artworkDetailSchema,
});
export type ArtworkDetailResult = z.infer<typeof artworkDetailResultSchema>;

// 에러 코드(공통 ApiError.code 매칭용).
export const ArtworkDetailErrorCode = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    ARTWORK_NOT_FOUND: 'ARTWORK_NOT_FOUND',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type ArtworkDetailErrorCode =
    (typeof ArtworkDetailErrorCode)[keyof typeof ArtworkDetailErrorCode];
