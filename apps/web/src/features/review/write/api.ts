import type {
    ReviewCreateResult,
    ReviewImageUploadRequest,
    ReviewImageUploadResult,
    ReviewUpdateResult,
    ReviewWriteRequest,
} from '@todam/shared';

import { apiFetch } from '@/shared/api';

const BASE = '/api/v1';

// ─── 리뷰 작성 ───────────────────────────────────────────────────
// POST /reservations/{reservationId}/review (201) — body = ReviewWriteRequest.
// 응답 data.review = reviewDetailSchema (GET 과 동일 shape).
export function createReview(reservationId: string, body: ReviewWriteRequest) {
    return apiFetch<ReviewCreateResult>(
        `${BASE}/reservations/${encodeURIComponent(reservationId)}/review`,
        { method: 'POST', body },
    );
}

// ─── 리뷰 수정 ───────────────────────────────────────────────────
// PATCH /reviews/{reviewId} (200) — body = ReviewWriteRequest (POST 와 동일).
// 응답 shape 는 D15(photos URL[] + updatedAt) — FE 는 invalidate+GET 재조회로 갱신.
export function updateReview(reviewId: string, body: ReviewWriteRequest) {
    return apiFetch<ReviewUpdateResult>(`${BASE}/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'PATCH',
        body,
    });
}

// ─── 리뷰 사진 presigned URL 발급 (D14) ──────────────────────────
// POST /review/images/presigned — 응답에 S3 key 포함(POST/PATCH photos[] 에 적재).
export function uploadReviewImage(req: ReviewImageUploadRequest) {
    return apiFetch<ReviewImageUploadResult>(`${BASE}/review/images/presigned`, {
        method: 'POST',
        body: req,
    });
}

// ─── S3 직접 업로드 ──────────────────────────────────────────────
// Pre-signed URL 로 PUT (Authorization 헤더 제외 — program/edit/api.ts uploadToS3 패턴).
export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
    const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
    });
    if (!res.ok) {
        throw new Error(`S3 업로드 실패: ${res.status}`);
    }
}
