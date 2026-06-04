'use client';

import { useQuery } from '@tanstack/react-query';

import { getPartnerProgramDetail } from './api';

// 파트너 클래스 상세 쿼리 키.
const DETAIL_KEY = (storeId: string, programId: string) =>
    ['partner', 'stores', storeId, 'programs', programId] as const;

// 파트너 클래스 상세 조회 훅.
export function usePartnerProgramDetail(storeId: string, programId: string) {
    return useQuery({
        queryKey: DETAIL_KEY(storeId, programId),
        queryFn: () => getPartnerProgramDetail(storeId, programId),
        enabled: !!storeId && !!programId,
        staleTime: 30_000,
    });
}
