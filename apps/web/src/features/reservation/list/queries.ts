'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { RESERVATION_LIST_DEFAULT_LIMIT, type ReservationStatus } from '@todam/shared';

import { getMyReservations } from './api';

const KEY = ['reservations', 'me'] as const;

export type UseMyReservationsParams = {
    status?: ReservationStatus;
    limit?: number;
};

// 무한 스크롤용 hook. cursor=null → 첫 페이지, 이후 응답의 nextCursor 가 다음 페이지 키.
export function useMyReservations({ status, limit }: UseMyReservationsParams = {}) {
    return useInfiniteQuery({
        queryKey: [...KEY, { status, limit }] as const,
        queryFn: ({ pageParam }) =>
            getMyReservations({
                status,
                limit: limit ?? RESERVATION_LIST_DEFAULT_LIMIT,
                cursor: pageParam,
            }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    });
}
