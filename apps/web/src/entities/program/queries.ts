'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ProgramReviewSort, UpdateProgramStatusRequest } from '@todam/shared';

import { getPartnerProgramDetail, getProgramReviews, getPublicProgramDetail, updateProgramStatus } from './api';

const PROGRAMS_KEY = (storeId: string) => ['partner', 'stores', storeId, 'programs'] as const;
const DETAIL_KEY = (storeId: string, programId: string) =>
    [...PROGRAMS_KEY(storeId), programId] as const;
const PUBLIC_DETAIL_KEY = (storeSlug: string, programId: string) =>
    ['public', 'stores', storeSlug, 'programs', programId] as const;
const PUBLIC_REVIEWS_KEY = (
    storeSlug: string,
    programId: string,
    params: { page: number; limit: number; sort: ProgramReviewSort },
) => [...PUBLIC_DETAIL_KEY(storeSlug, programId), 'reviews', params] as const;

export function usePartnerProgramDetail(storeId: string, programId: string) {
    return useQuery({
        queryKey: DETAIL_KEY(storeId, programId),
        queryFn: () => getPartnerProgramDetail(storeId, programId),
        enabled: !!storeId && !!programId,
        staleTime: 30_000,
    });
}

export function usePublicProgramDetail(storeSlug: string, programId: string) {
    return useQuery({
        queryKey: PUBLIC_DETAIL_KEY(storeSlug, programId),
        queryFn: () => getPublicProgramDetail(storeSlug, programId),
        enabled: !!storeSlug && !!programId,
        staleTime: 30_000,
    });
}

export function useProgramReviews(
    storeSlug: string,
    programId: string,
    params: { page?: number; limit?: number; sort?: ProgramReviewSort } = {},
) {
    const normalized = {
        page: params.page ?? 1,
        limit: params.limit ?? 3,
        sort: params.sort ?? 'latest',
    } satisfies { page: number; limit: number; sort: ProgramReviewSort };

    return useQuery({
        queryKey: PUBLIC_REVIEWS_KEY(storeSlug, programId, normalized),
        queryFn: () => getProgramReviews(storeSlug, programId, normalized),
        enabled: !!storeSlug && !!programId,
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
