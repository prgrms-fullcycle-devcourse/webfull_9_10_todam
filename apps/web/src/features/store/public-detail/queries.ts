'use client';

import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';

import { getPublicStoreDetail, getPublicStorePrograms } from './api';

export function retryExceptNotFound(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) return false;
    return failureCount < 1;
}

export const publicStoreDetailKey = (slug: string) => ['public', 'stores', slug, 'detail'] as const;

export const publicStoreProgramsKey = (slug: string) =>
    ['public', 'stores', slug, 'programs'] as const;

// 공방 상세 (GET /stores/{slug})
export function usePublicStoreDetail(slug: string) {
    return useQuery({
        queryKey: publicStoreDetailKey(slug),
        queryFn: () => getPublicStoreDetail(slug),
        enabled: Boolean(slug),
        retry: retryExceptNotFound,
        staleTime: 60_000,
    });
}

// 운영 클래스 목록 (GET /stores/{slug}/programs)
export function usePublicStorePrograms(slug: string) {
    return useQuery({
        queryKey: publicStoreProgramsKey(slug),
        queryFn: () => getPublicStorePrograms(slug),
        enabled: Boolean(slug),
        retry: retryExceptNotFound,
        staleTime: 60_000,
    });
}
