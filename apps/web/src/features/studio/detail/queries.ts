'use client';

import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';

import { getPublicStudioDetail, getPublicStudioPrograms } from './api';

export function retryExceptNotFound(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) return false;
    return failureCount < 1;
}

export const publicStudioDetailKey = (slug: string) =>
    ['public', 'studios', slug, 'detail'] as const;

export const publicStudioProgramsKey = (slug: string) =>
    ['public', 'studios', slug, 'programs'] as const;

// 공방 상세 (GET /stores/{slug})
export function usePublicStudioDetail(slug: string) {
    return useQuery({
        queryKey: publicStudioDetailKey(slug),
        queryFn: () => getPublicStudioDetail(slug),
        enabled: Boolean(slug),
        retry: retryExceptNotFound,
        staleTime: 60_000,
    });
}

// 운영 클래스 목록 (GET /stores/{slug}/programs)
export function usePublicStudioPrograms(slug: string) {
    return useQuery({
        queryKey: publicStudioProgramsKey(slug),
        queryFn: () => getPublicStudioPrograms(slug),
        enabled: Boolean(slug),
        retry: retryExceptNotFound,
        staleTime: 60_000,
    });
}
