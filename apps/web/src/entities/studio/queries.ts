'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';

import {
    getCurrentStudio,
    getPartnerStudioDetail,
    getPartnerStudioPrograms,
    updateCurrentStudio,
} from './api';

const currentStudioKey = ['partner', 'current-studio'] as const;
const detailKey = (storeId: string) => ['partner', 'studios', storeId] as const;
const programsKey = (storeId: string) => ['partner', 'studios', storeId, 'programs'] as const;

function noRetryOnAuthOrNotFound(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) return false;
    return failureCount < 2;
}

function retryOnceExceptAuthOrNotFound(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) return false;
    return failureCount < 1;
}

export function useCurrentStudioQuery(enabled = true) {
    return useQuery({
        queryKey: [...currentStudioKey],
        queryFn: getCurrentStudio,
        retry: noRetryOnAuthOrNotFound,
        enabled,
        staleTime: 1000 * 60 * 5,
    });
}

export function useUpdateCurrentStudioMutation() {
    return useMutation({
        mutationFn: (storeId: string) => updateCurrentStudio(storeId),
    });
}

export function usePartnerStudioDetail(storeId: string) {
    return useQuery({
        queryKey: detailKey(storeId),
        queryFn: () => getPartnerStudioDetail(storeId),
        enabled: Boolean(storeId),
        retry: retryOnceExceptAuthOrNotFound,
    });
}

export function usePartnerStudioPrograms(storeId: string) {
    return useQuery({
        queryKey: programsKey(storeId),
        queryFn: () => getPartnerStudioPrograms(storeId),
        enabled: Boolean(storeId),
        retry: retryOnceExceptAuthOrNotFound,
    });
}
