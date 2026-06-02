import { z } from 'zod';

import { MAX_REVIEW_PHOTO_COUNT } from '../constants/file';
import { reviewDetailSchema } from './reservation-detail';

// 리뷰 작성/수정 contract.
// - 작성: POST /reservations/{reservationId}/review (201) → data.review = reviewDetailSchema (GET 와 동일 shape)
// - 수정: PATCH /reviews/{reviewId} (200) → data.review = reviewUpdateResponseSchema (D15 — POST/GET 와 shape 불일치)
// - presigned: POST /review/images/presigned (D14 — Notion 명세 본문 부재, program presigned 패턴 기반 추론)
// 정본 스냅샷: docs/exec-plans/active/유저 예약 - 리뷰 작성, 나의 리뷰 수정.md §API Contract

// ─── 작성/수정 공용 요청 바디 ────────────────────────────────────────
export const reviewWriteRequestSchema = z.object({
    rating: z.number().int().min(1).max(5),
    content: z.string().max(500).optional(),
    photos: z.array(z.string()).max(MAX_REVIEW_PHOTO_COUNT).optional(),
});
export type ReviewWriteRequest = z.infer<typeof reviewWriteRequestSchema>;

// ─── 작성 응답 (POST) — GET 과 동일 shape (reviewDetailSchema 재사용) ──
export const reviewCreateResultSchema = z.object({
    review: reviewDetailSchema,
});
export type ReviewCreateResult = z.infer<typeof reviewCreateResultSchema>;

// ─── 수정 응답 (PATCH) — D15: photos URL 문자열배열 + updatedAt, reservationId 없음 ──
export const reviewUpdateResponseSchema = z.object({
    id: z.string(),
    rating: z.number().min(0).max(5),
    content: z.string(),
    photos: z.array(z.string()),
    updatedAt: z.string(), // ISO 8601
});
export type ReviewUpdateResponse = z.infer<typeof reviewUpdateResponseSchema>;

export const reviewUpdateResultSchema = z.object({
    review: reviewUpdateResponseSchema,
});
export type ReviewUpdateResult = z.infer<typeof reviewUpdateResultSchema>;

// ─── presigned (D14 — BE 명세 확정 전 추론) ──────────────────────────
// request: program-edit 패턴 차용(리뷰는 isThumbnail 없음).
export const reviewImageUploadRequestSchema = z.object({
    fileName: z.string(),
    fileType: z.string(),
});
export type ReviewImageUploadRequest = z.infer<typeof reviewImageUploadRequestSchema>;

// response: 작성/수정 photos[] 가 S3 Key 를 수용하므로 응답에 key 필수(program 은 imageUrl).
// D14 확정 시 정본에 맞춰 조정.
export const reviewImageUploadResultSchema = z.object({
    uploadUrl: z.string(),
    key: z.string(),
});
export type ReviewImageUploadResult = z.infer<typeof reviewImageUploadResultSchema>;

// ─── 에러 코드(공통 ApiError.code 매칭용) ────────────────────────────
export const ReviewWriteErrorCode = {
    REVIEW_DEADLINE_EXCEEDED: 'REVIEW_DEADLINE_EXCEEDED',
    REVIEW_EDIT_DEADLINE_EXCEEDED: 'REVIEW_EDIT_DEADLINE_EXCEEDED',
    REVIEW_ALREADY_EXISTS: 'REVIEW_ALREADY_EXISTS',
    RESERVATION_NOT_FOUND: 'RESERVATION_NOT_FOUND',
    REVIEW_NOT_FOUND: 'REVIEW_NOT_FOUND',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type ReviewWriteErrorCode = (typeof ReviewWriteErrorCode)[keyof typeof ReviewWriteErrorCode];
