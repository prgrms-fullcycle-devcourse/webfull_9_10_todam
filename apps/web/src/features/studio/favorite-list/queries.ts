'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { getFavoriteStudios } from './api';

// 정본 limit 기본값 10 (D7 — 팀 공통 DEFAULT_PAGE_SIZE 와 drift, BE 확인 시 조정).
const FAVORITE_LIST_DEFAULT_LIMIT = 10;

export const FAVORITE_STUDIOS_QUERY_KEY = ['favorite-studios', 'me'] as const;

export type UseFavoriteStudiosParams = {
    limit?: number;
};

// 무한 스크롤용 hook. cursor=null → 첫 페이지, 이후 응답의 nextCursor 가 다음 페이지 키.
// hasMore 필드 없음(D7) → nextCursor === null 이면 다음 페이지 없음.
export function useFavoriteStudios({ limit }: UseFavoriteStudiosParams = {}) {
    return useInfiniteQuery({
        queryKey: [...FAVORITE_STUDIOS_QUERY_KEY, { limit }] as const,
        queryFn: ({ pageParam }) =>
            getFavoriteStudios({
                limit: limit ?? FAVORITE_LIST_DEFAULT_LIMIT,
                cursor: pageParam,
            }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });
}
