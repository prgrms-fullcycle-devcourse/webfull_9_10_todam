'use client';

import { useQuery } from '@tanstack/react-query';

import { ApiError } from '../../../shared/api';

import { getPartnerStoreDetail, getPartnerStorePrograms } from './api';

const detailKey = (storeId: string) => ['partner', 'stores', storeId] as const;
const programsKey = (storeId: string) => ['partner', 'stores', storeId, 'programs'] as const;

// 401/403/404 는 사용자 권한·존재 문제이므로 재시도하지 않는다. 일시 오류(예: 500/네트워크)만 1회 재시도.
function retry(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) return false;
    return failureCount < 1;
}

// 내 공방 상세 조회
export function usePartnerStoreDetail(storeId: string) {
    return useQuery({
        queryKey: detailKey(storeId),
        queryFn: () => getPartnerStoreDetail(storeId),
        enabled: Boolean(storeId),
        retry,
    });
}

// 공방 운영 클래스 목록
export function usePartnerStorePrograms(storeId: string) {
    return useQuery({
        queryKey: programsKey(storeId),
        queryFn: () => getPartnerStorePrograms(storeId),
        enabled: Boolean(storeId),
        retry,
    });
}
