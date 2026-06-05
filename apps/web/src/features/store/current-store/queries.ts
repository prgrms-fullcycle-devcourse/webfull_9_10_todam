'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';

import { getCurrentStore, updateCurrentStore } from './api';

const KEY = ['partner', 'current-store'] as const;

export function useCurrentStoreQuery(enabled = true) {
    return useQuery({
        queryKey: [...KEY],
        queryFn: getCurrentStore,
        // 401/403/404 는 사용자 시점에 변하지 않으므로 retry 비활성.
        retry: (failureCount, error) => {
            if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) {
                return false;
            }
            return failureCount < 2;
        },
        enabled,
        staleTime: 1000 * 60 * 5, // 5분 — 세션 중 재조회 최소화
    });
}

export function useUpdateCurrentStoreMutation() {
    return useMutation({
        mutationFn: (storeId: string) => updateCurrentStore(storeId),
    });
}
