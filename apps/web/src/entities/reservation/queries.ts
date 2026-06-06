'use client';

import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';

import { getReservationDetail, getReservationReview } from './api';

const KEY = ['reservations', 'detail'] as const;
const REVIEW_KEY = ['reservations', 'review'] as const;

export function useReservationDetail(reservationId: string) {
    return useQuery({
        queryKey: [...KEY, reservationId] as const,
        queryFn: () => getReservationDetail(reservationId),
        retry: (failureCount, error) => {
            if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) {
                return false;
            }
            return failureCount < 2;
        },
        enabled: Boolean(reservationId),
    });
}

export function useReservationReview(reservationId: string, enabled: boolean) {
    return useQuery({
        queryKey: [...REVIEW_KEY, reservationId] as const,
        queryFn: () => getReservationReview(reservationId),
        retry: (failureCount, error) => {
            if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) {
                return false;
            }
            return failureCount < 2;
        },
        enabled: enabled && Boolean(reservationId),
    });
}
