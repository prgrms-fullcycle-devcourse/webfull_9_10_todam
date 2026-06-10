'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { DEFAULT_LAT, DEFAULT_LNG, getStudios } from '@/features/studio/search/api';

// 근처 공방 목록 — 위치 기반 무한 스크롤 (keyword 없음, lat/lng만).
// contract: docs/exec-plans/active/user-근처-공방-목록-조회.md § API Contract
// - lat/lng 는 첫 요청 시 고정 후 커서 페이지 요청에서도 동일 값 유지 (plan decision #3).
// - 권한 거부/실패 시 lat=37.5446, lng=127.0560 (성수동) 상수 폴백 (plan decision #4).

export const NEARBY_STUDIOS_QUERY_KEY = ['studios', 'nearby'] as const;

const NEARBY_DEFAULT_LIMIT = 10;

export type UseNearbyStudiosParams = {
    lat?: number | null;
    lng?: number | null;
    limit?: number;
    enabled?: boolean;
};

// 커서 기반 무한 스크롤 hook.
// lat/lng 가 null 이면 폴백 성수동 좌표 사용.
// queryKey 에 고정 lat/lng 를 포함해 좌표가 정해진 뒤 쿼리가 한 번만 실행되도록 한다.
// enabled=false 이면 위치 획득 전까지 쿼리 대기(위치 확정 후 자동 실행).
export function useNearbyStudios({ lat, lng, limit, enabled = true }: UseNearbyStudiosParams = {}) {
    const resolvedLat = lat ?? DEFAULT_LAT;
    const resolvedLng = lng ?? DEFAULT_LNG;

    return useInfiniteQuery({
        queryKey: [...NEARBY_STUDIOS_QUERY_KEY, { lat: resolvedLat, lng: resolvedLng, limit }],
        queryFn: ({ pageParam }) =>
            getStudios({
                lat: resolvedLat,
                lng: resolvedLng,
                cursor: pageParam,
                limit: limit ?? NEARBY_DEFAULT_LIMIT,
            }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) =>
            lastPage.pageInfo.hasNext ? (lastPage.pageInfo.nextCursor ?? undefined) : undefined,
        enabled,
        staleTime: 1000 * 60 * 3,
    });
}
