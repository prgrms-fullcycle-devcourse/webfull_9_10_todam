import type {
    CalendarData,
    CancelPartnerReservationRequest,
    CreatePartnerReservationRequest,
    CreatePartnerReservationResponse,
    CreateReservationRestrictionsRequest,
    DeleteReservationRestrictionsRequest,
    ListTimeSlotsResult,
    PartnerReservationDetailResponse,
    PartnerReservationStatusResponse,
    ProgramReservationCountsResult,
    ReservationDetailResponse,
    ReservationListData,
    RejectPartnerReservationRequest,
    ReviewDetailResponse,
} from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const PARTNER_BASE = '/partner';

export function getReservationDetail(reservationId: string) {
    return clientApiFetch<ReservationDetailResponse>(`/reservations/${reservationId}`, {
        method: 'GET',
    });
}

export function getReservationReview(reservationId: string) {
    return clientApiFetch<ReviewDetailResponse>(`/reservations/${reservationId}/review`, {
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

export function getPartnerTimeSlotsByDate(storeId: string, date: string) {
    const params = new URLSearchParams({ date });

    return clientApiFetch<ListTimeSlotsResult>(
        `${PARTNER_BASE}/stores/${encodeURIComponent(storeId)}/time-slots?${params}`,
        { method: 'GET' },
    );
}

export function getPartnerProgramReservationCounts(
    storeId: string,
    date: string,
    timeSlotIds?: string[],
) {
    const params = new URLSearchParams({ date });
    if (timeSlotIds?.length) {
        params.set('timeSlotIds', timeSlotIds.join(','));
    }

    return clientApiFetch<ProgramReservationCountsResult>(
        `${PARTNER_BASE}/stores/${encodeURIComponent(storeId)}/programs/reservation-counts?${params}`,
        { method: 'GET' },
    );
}

export function createPartnerReservation(storeId: string, body: CreatePartnerReservationRequest) {
    return clientApiFetch<CreatePartnerReservationResponse>(
        `${PARTNER_BASE}/stores/${encodeURIComponent(storeId)}/reservations`,
        { method: 'POST', body },
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

export function createPartnerReservationRestrictions(
    storeId: string,
    body: CreateReservationRestrictionsRequest,
) {
    return clientApiFetch<{ message: string }>(
        `${PARTNER_BASE}/stores/${encodeURIComponent(storeId)}/reservation-restrictions`,
        { method: 'POST', body },
    );
}

export function deletePartnerReservationRestrictions(
    storeId: string,
    body: DeleteReservationRestrictionsRequest,
) {
    return clientApiFetch<{ message: string }>(
        `${PARTNER_BASE}/stores/${encodeURIComponent(storeId)}/reservation-restrictions`,
        { method: 'DELETE', body },
    );
}
