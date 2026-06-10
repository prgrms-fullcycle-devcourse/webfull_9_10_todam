'use client';

import { useQuery } from '@tanstack/react-query';

import { getPartnerPrograms } from './api';

const KEY = (storeId: string) => ['partner', 'studios', storeId, 'programs'] as const;

// 파트너 클래스 목록 조회
export function usePartnerPrograms(storeId: string) {
    return useQuery({
        queryKey: KEY(storeId),
        queryFn: () => getPartnerPrograms(storeId),
        enabled: Boolean(storeId),
    });
}
