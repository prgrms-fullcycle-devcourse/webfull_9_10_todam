import { clientApiFetch } from '@/shared/api';

const BASE = '/api/v1';

export function deleteReview(reviewId: string) {
    return clientApiFetch<null>(`${BASE}/reviews/${reviewId}`, { method: 'DELETE' });
}
