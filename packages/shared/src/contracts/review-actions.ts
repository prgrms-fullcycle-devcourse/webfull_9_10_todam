import { z } from 'zod';

// ─── 리뷰 삭제 (DELETE /reviews/{reviewId}) ──────────────────────────
// 정본(Notion API명세 DB) 기준 + D5/D6 보정.
// docs/exec-plans/active/유저 예약 - 나의 리뷰 상세 조회, 나의 리뷰 삭제.md 의
// "API Contract (스냅샷)" 섹션과 1:1로 바인딩한다. 임의 변경 금지.
//
// 응답 200 OK 의 data 는 null. apiFetch 가 공통 봉투를 벗기고 data 만 반환하므로
// FE 가 받는 타입은 null.
// 상세 조회 contract(reviewDetailSchema 등)는 reservation-detail.ts 의 기존 정의를 재사용.

export const reviewDeleteResponseSchema = z.null();
export type ReviewDeleteResponse = z.infer<typeof reviewDeleteResponseSchema>;

// 에러 코드(공통 ApiError.code 매칭용).
export const ReviewActionsErrorCode = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    REVIEW_NOT_FOUND: 'REVIEW_NOT_FOUND',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type ReviewActionsErrorCode =
    (typeof ReviewActionsErrorCode)[keyof typeof ReviewActionsErrorCode];
