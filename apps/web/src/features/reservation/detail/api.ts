import type { ReservationDetailResult, ReviewDetailResult } from '@todam/shared';

import { apiFetch } from '../../../shared/api';

const BASE = '/api/v1';

// 예약 상세 조회 (단건).
// contract: docs/exec-plans/active/유저 예약 - 예약 상세조회.md
// GET /reservations/{reservationId}
export function getReservationDetail(reservationId: string) {
    return apiFetch<ReservationDetailResult>(`${BASE}/reservations/${reservationId}`, {
        method: 'GET',
    });
}

// 예약별 리뷰 상세 (D4 가정 endpoint — BE 채택 패턴 결정 대기).
// 다르게 결정되면 가벼운 리워크(URL · queryKey 변경) 정도.
// GET /reservations/{reservationId}/review
export function getReservationReview(reservationId: string) {
    return apiFetch<ReviewDetailResult>(`${BASE}/reservations/${reservationId}/review`, {
        method: 'GET',
    });
}
