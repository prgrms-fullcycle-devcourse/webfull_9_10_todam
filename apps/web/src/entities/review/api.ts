import { clientApiFetch } from '@/shared/api';

// BE global prefix 없음. 실 경로 = /reviews/:reviewId.
// MSW 모드에서는 handlers.ts 의 */reviews/:reviewId 패턴이 처리.
export function deleteReview(reviewId: string) {
    return clientApiFetch<null>(`/reviews/${reviewId}`, { method: 'DELETE' });
}
