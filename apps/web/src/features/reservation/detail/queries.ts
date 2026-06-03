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
        // 401/403/404 는 사용자 시점에 변하지 않으므로 retry 비활성.
        retry: (failureCount, error) => {
            if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) {
                return false;
            }
            return failureCount < 2;
        },
        enabled: Boolean(reservationId),
    });
}

// D4: 리뷰 상세는 별도 endpoint 가정. hasReview=true 일 때만 enabled.
// BE 채택 패턴 다르면 본 hook 의 URL/queryKey 만 가벼운 리워크.
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
