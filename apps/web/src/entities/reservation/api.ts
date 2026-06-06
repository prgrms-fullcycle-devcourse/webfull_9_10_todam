import type { ReservationDetailResult, ReviewDetailResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/api/v1';

export function getReservationDetail(reservationId: string) {
    return clientApiFetch<ReservationDetailResult>(`${BASE}/reservations/${reservationId}`, {
        method: 'GET',
    });
}

export function getReservationReview(reservationId: string) {
    return clientApiFetch<ReviewDetailResult>(`${BASE}/reservations/${reservationId}/review`, {
        method: 'GET',
    });
}
