'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { DEFAULT_LAT, DEFAULT_LNG, getAutocomplete, getStudios } from './api';

export const STUDIOS_SEARCH_QUERY_KEY = ['studios', 'search'] as const;
export const AUTOCOMPLETE_QUERY_KEY = ['studios', 'autocomplete'] as const;

const STORES_DEFAULT_LIMIT = 10;

export type UseStudioSearchParams = {
    keyword: string;
    lat?: number;
    lng?: number;
    limit?: number;
    enabled?: boolean;
};

// 커서 기반 무한 스크롤 — 검색 결과 (GET /stores?keyword=…)
// pageInfo.hasNext + pageInfo.nextCursor 로 다음 페이지 판정.
export function useStudioSearch({
    keyword,
    lat,
    lng,
    limit,
    enabled = true,
}: UseStudioSearchParams) {
    const resolvedLat = lat ?? DEFAULT_LAT;
    const resolvedLng = lng ?? DEFAULT_LNG;

    return useInfiniteQuery({
        queryKey: [
            ...STUDIOS_SEARCH_QUERY_KEY,
            { keyword, lat: resolvedLat, lng: resolvedLng, limit },
        ],
        queryFn: ({ pageParam }) =>
            getStudios({
                keyword,
                lat: resolvedLat,
                lng: resolvedLng,
                cursor: pageParam,
                limit: limit ?? STORES_DEFAULT_LIMIT,
            }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) =>
            lastPage.pageInfo.hasNext ? (lastPage.pageInfo.nextCursor ?? undefined) : undefined,
        enabled: enabled && keyword.trim().length > 0,
        staleTime: 1000 * 60,
    });
}

export type UseAutocompleteParams = {
    keyword: string;
    enabled?: boolean;
};

// 자동완성 — debounce 는 SearchClient 에서 관리, 여기서는 enabled 게이트만.
// keyword 공백 차단 (400 KEYWORD_REQUIRED 사전 방어).
export function useAutocomplete({ keyword, enabled = true }: UseAutocompleteParams) {
    const trimmed = keyword.trim();
    return useQuery({
        queryKey: [...AUTOCOMPLETE_QUERY_KEY, { keyword: trimmed }],
        queryFn: () => getAutocomplete({ keyword: trimmed }),
        enabled: enabled && trimmed.length > 0,
        staleTime: 1000 * 30,
    });
}
