'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';

import {
    getCurrentStore,
    getPartnerStoreDetail,
    getPartnerStorePrograms,
    updateCurrentStore,
} from './api';

const currentStoreKey = ['partner', 'current-store'] as const;
const detailKey = (storeId: string) => ['partner', 'stores', storeId] as const;
const programsKey = (storeId: string) => ['partner', 'stores', storeId, 'programs'] as const;

function noRetryOnAuthOrNotFound(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) return false;
    return failureCount < 2;
}

function retryOnceExceptAuthOrNotFound(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) return false;
    return failureCount < 1;
}

export function useCurrentStoreQuery(enabled = true) {
    return useQuery({
        queryKey: [...currentStoreKey],
        queryFn: getCurrentStore,
        retry: noRetryOnAuthOrNotFound,
        enabled,
        staleTime: 1000 * 60 * 5,
    });
}

export function useUpdateCurrentStoreMutation() {
    return useMutation({
        mutationFn: (storeId: string) => updateCurrentStore(storeId),
    });
}

export function usePartnerStoreDetail(storeId: string) {
    return useQuery({
        queryKey: detailKey(storeId),
        queryFn: () => getPartnerStoreDetail(storeId),
        enabled: Boolean(storeId),
        retry: retryOnceExceptAuthOrNotFound,
    });
}

export function usePartnerStorePrograms(storeId: string) {
    return useQuery({
        queryKey: programsKey(storeId),
        queryFn: () => getPartnerStorePrograms(storeId),
        enabled: Boolean(storeId),
        retry: retryOnceExceptAuthOrNotFound,
    });
}
