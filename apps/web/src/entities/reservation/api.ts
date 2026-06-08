import type {
    CalendarData,
    ReservationDetailResult,
    ReservationListData,
    ReviewDetailResult,
} from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/api/v1';

const PARTNER_BASE = '/partner';

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

export function getPartnerReservationCalendar(storeId: string, year: number, month: number) {
    const params = new URLSearchParams({
        year: String(year),
        month: String(month),
    });

    return clientApiFetch<CalendarData>(
        `${PARTNER_BASE}/stores/${encodeURIComponent(storeId)}/reservations/calendar?${params}`,
        { method: 'GET' },
    );
}

export function getPartnerReservationsByDate(storeId: string, date: string) {
    const params = new URLSearchParams({ date });

    return clientApiFetch<ReservationListData>(
        `${PARTNER_BASE}/stores/${encodeURIComponent(storeId)}/reservations?${params}`,
        { method: 'GET' },
    );
}
