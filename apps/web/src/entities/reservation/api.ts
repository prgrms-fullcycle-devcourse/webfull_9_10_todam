import type {
    CalendarData,
    CancelPartnerReservationRequest,
    PartnerReservationDetailResponse,
    PartnerReservationStatusResponse,
    ReservationDetailResponse,
    ReservationListData,
    RejectPartnerReservationRequest,
    ReviewDetailResponse,
} from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/api/v1';

const PARTNER_BASE = '/partner';

export function getReservationDetail(reservationId: string) {
    return clientApiFetch<ReservationDetailResponse>(`${BASE}/reservations/${reservationId}`, {
        method: 'GET',
    });
}

export function getReservationReview(reservationId: string) {
    return clientApiFetch<ReviewDetailResponse>(`${BASE}/reservations/${reservationId}/review`, {
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

export function getPartnerReservationDetail(reservationId: string) {
    return clientApiFetch<PartnerReservationDetailResponse>(
        `${PARTNER_BASE}/reservations/${encodeURIComponent(reservationId)}`,
        { method: 'GET' },
    );
}

export function confirmPartnerReservation(reservationId: string) {
    return clientApiFetch<PartnerReservationStatusResponse>(
        `${PARTNER_BASE}/reservations/${encodeURIComponent(reservationId)}/confirm`,
        { method: 'PATCH' },
    );
}

export function rejectPartnerReservation(
    reservationId: string,
    body: RejectPartnerReservationRequest,
) {
    return clientApiFetch<PartnerReservationStatusResponse>(
        `${PARTNER_BASE}/reservations/${encodeURIComponent(reservationId)}/reject`,
        { method: 'PATCH', body },
    );
}

export function cancelPartnerReservation(
    reservationId: string,
    body: CancelPartnerReservationRequest,
) {
    return clientApiFetch<PartnerReservationStatusResponse>(
        `${PARTNER_BASE}/reservations/${encodeURIComponent(reservationId)}/cancel`,
        { method: 'PATCH', body },
    );
}

export function completePartnerReservation(reservationId: string) {
    return clientApiFetch<PartnerReservationStatusResponse>(
        `${PARTNER_BASE}/reservations/${encodeURIComponent(reservationId)}/complete`,
        { method: 'PATCH' },
    );
}
