'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getNotifications, readAllNotifications, readNotification } from './api';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;
export const NOTIFICATIONS_UNREAD_QUERY_KEY = ['notifications', 'unread-count'] as const;

const NOTIFICATIONS_LIMIT = 20;

// GET /notifications — 커서 기반 무한 스크롤.
export function useInfiniteNotifications() {
    return useInfiniteQuery({
        queryKey: NOTIFICATIONS_QUERY_KEY,
        queryFn: ({ pageParam }) =>
            getNotifications({ cursor: pageParam ?? undefined, limit: NOTIFICATIONS_LIMIT }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        // 페이지 진입 때마다 최신 목록 — 캐시 무시하고 항상 재조회.
        staleTime: 0,
        refetchOnMount: 'always',
    });
}

// 헤더 뱃지용 미읽음 카운트 — 가벼운 단건 조회(응답의 unreadCount만 사용).
// enabled=false(비로그인) 시 조회 안 함(401 방지).
export function useUnreadNotificationCount(enabled = true) {
    return useQuery({
        queryKey: NOTIFICATIONS_UNREAD_QUERY_KEY,
        queryFn: () => getNotifications({ limit: 1 }),
        select: (data) => data.unreadCount,
        staleTime: 1000 * 30,
        enabled,
    });
}

function invalidateNotifications(queryClient: ReturnType<typeof useQueryClient>) {
    void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_QUERY_KEY });
}

// PATCH /notifications/:id/read
export function useReadNotification() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => readNotification(id),
        onSuccess: () => invalidateNotifications(queryClient),
    });
}

// PATCH /notifications/read-all
export function useReadAllNotifications() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: readAllNotifications,
        onSuccess: () => invalidateNotifications(queryClient),
    });
}
