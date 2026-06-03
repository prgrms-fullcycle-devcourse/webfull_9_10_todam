import { apiFetch } from '@/shared/api';

const BASE = '/api/v1';

// 리뷰 삭제.
// contract: docs/exec-plans/active/유저 예약 - 나의 리뷰 상세 조회, 나의 리뷰 삭제.md
// DELETE /reviews/{reviewId}
// 응답 봉투의 data 는 null.
export function deleteReview(reviewId: string) {
    return apiFetch<null>(`${BASE}/reviews/${reviewId}`, { method: 'DELETE' });
}
