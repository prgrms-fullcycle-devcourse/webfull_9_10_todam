import { ReservationStatus, type ReservationListResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/api/v1';

export type GetMyReservationsParams = {
    status?: ReservationStatus;
    cursor?: string | null;
    limit?: number;
};

// 나의 예약 목록 조회 (커서 페이지네이션).
// contract: docs/exec-plans/active/user-예약-나의 예약조회.md
// GET /reservations/me?status=&cursor=&limit=
export function getMyReservations({ status, cursor, limit }: GetMyReservationsParams = {}) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (cursor) params.set('cursor', cursor);
    if (typeof limit === 'number') params.set('limit', String(limit));
    const qs = params.toString();
    return clientApiFetch<ReservationListResult>(`${BASE}/reservations/me${qs ? `?${qs}` : ''}`, {
        method: 'GET',
    });
}
