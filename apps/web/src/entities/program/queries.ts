'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ProgramReviewSort, UpdateProgramStatusRequest } from '@todam/shared';

import {
    getPartnerProgramDetail,
    getProgramReviews,
    getPublicProgramDetail,
    updateProgramStatus,
} from './api';

const PROGRAMS_KEY = (storeId: string) => ['partner', 'studios', storeId, 'programs'] as const;
const DETAIL_KEY = (storeId: string, programId: string) =>
    [...PROGRAMS_KEY(storeId), programId] as const;
const PUBLIC_DETAIL_KEY = (programId: string) => ['public', 'programs', programId] as const;
const PUBLIC_REVIEWS_KEY = (
    programId: string,
    params: { page: number; limit: number; sort: ProgramReviewSort },
) => [...PUBLIC_DETAIL_KEY(programId), 'reviews', params] as const;

export function usePartnerProgramDetail(storeId: string, programId: string) {
    return useQuery({
        queryKey: DETAIL_KEY(storeId, programId),
        queryFn: () => getPartnerProgramDetail(storeId, programId),
        enabled: !!storeId && !!programId,
        staleTime: 30_000,
    });
}

export function usePublicProgramDetail(programId: string) {
    return useQuery({
        queryKey: PUBLIC_DETAIL_KEY(programId),
        queryFn: () => getPublicProgramDetail(programId),
        enabled: !!programId,
        staleTime: 30_000,
    });
}

export function useProgramReviews(
    programId: string,
    params: { page?: number; limit?: number; sort?: ProgramReviewSort } = {},
) {
    const normalized = {
        page: params.page ?? 1,
        limit: params.limit ?? 3,
        sort: params.sort ?? 'latest',
    } satisfies { page: number; limit: number; sort: ProgramReviewSort };

    return useQuery({
        queryKey: PUBLIC_REVIEWS_KEY(programId, normalized),
        queryFn: () => getProgramReviews(programId, normalized),
        enabled: !!programId,
        staleTime: 30_000,
    });
}

// 클래스 리뷰 전체보기(무한 스크롤). page 기반 → currentPage<totalPages 면 다음 페이지.
export function useProgramReviewsInfinite(
    programId: string,
    sort: ProgramReviewSort = 'latest',
    limit = 10,
) {
    return useInfiniteQuery({
        queryKey: [
            ...PUBLIC_DETAIL_KEY(programId),
            'reviews',
            'infinite',
            { sort, limit },
        ] as const,
        queryFn: ({ pageParam }) => getProgramReviews(programId, { page: pageParam, limit, sort }),
        enabled: !!programId,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const { currentPage, totalPages } = lastPage.pagination;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
        staleTime: 30_000,
    });
}

export function useUpdateProgramStatus(storeId: string, programId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: UpdateProgramStatusRequest) =>
            updateProgramStatus(storeId, programId, body),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY(storeId) }),
    });
}
