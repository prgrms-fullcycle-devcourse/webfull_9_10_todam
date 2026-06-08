'use client';

import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';

import {
    getPartnerReservationCalendar,
    getPartnerReservationsByDate,
    getReservationDetail,
    getReservationReview,
} from './api';

const KEY = ['reservations', 'detail'] as const;
const REVIEW_KEY = ['reservations', 'review'] as const;
const PARTNER_CALENDAR_KEY = ['partner', 'reservations', 'calendar'] as const;
const PARTNER_LIST_KEY = ['partner', 'reservations', 'list'] as const;

function retryExceptAuthOrNotFound(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) {
        return false;
    }
    return failureCount < 2;
}

export function useReservationDetail(reservationId: string) {
    return useQuery({
        queryKey: [...KEY, reservationId] as const,
        queryFn: () => getReservationDetail(reservationId),
        retry: retryExceptAuthOrNotFound,
        enabled: Boolean(reservationId),
    });
}

export function useReservationReview(reservationId: string, enabled: boolean) {
    return useQuery({
        queryKey: [...REVIEW_KEY, reservationId] as const,
        queryFn: () => getReservationReview(reservationId),
        retry: retryExceptAuthOrNotFound,
        enabled: enabled && Boolean(reservationId),
    });
}

export function usePartnerReservationCalendar(storeId: string, year: number, month: number) {
    return useQuery({
        queryKey: [...PARTNER_CALENDAR_KEY, storeId, year, month] as const,
        queryFn: () => getPartnerReservationCalendar(storeId, year, month),
        retry: retryExceptAuthOrNotFound,
        enabled: Boolean(storeId) && year > 0 && month > 0,
    });
}

export function usePartnerReservationsByDate(storeId: string, date: string) {
    return useQuery({
        queryKey: [...PARTNER_LIST_KEY, storeId, date] as const,
        queryFn: () => getPartnerReservationsByDate(storeId, date),
        retry: retryExceptAuthOrNotFound,
        enabled: Boolean(storeId) && Boolean(date),
    });
}
