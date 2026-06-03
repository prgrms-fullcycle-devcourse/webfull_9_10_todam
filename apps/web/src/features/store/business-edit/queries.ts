'use client';

import type { BusinessDocumentUpdateRequest } from '@todam/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getBusinessEditStoreDetail, updateBusinessDocument } from './api';

// business-edit 전용 queryKey 격리 (partner-store-detail mock 캐시와 분리).
const KEY = ['business-edit', 'store'] as const;

// 사업자 정보 수정 화면 prefill 용 상세 조회 (GET /partner/stores/{storeId}, 실 BE).
export function useBusinessEditStoreDetail(storeId: string) {
    return useQuery({
        queryKey: [...KEY, storeId],
        queryFn: () => getBusinessEditStoreDetail(storeId),
        enabled: Boolean(storeId),
    });
}

// 사업자 정보 수정. 성공 시:
//  - business-edit 상세 캐시 무효화(상태 PENDING 전이 반영)
//  - 온보딩 캐시 무효화 → 루트 AppShell 게이트가 재심사(PENDING) 즉시 반영.
export function useUpdateBusinessDocument(storeId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: BusinessDocumentUpdateRequest) => updateBusinessDocument(storeId, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...KEY, storeId] });
            // usePartnerOnboarding queryKey: ['partner','onboarding','onboarding']
            qc.invalidateQueries({ queryKey: ['partner', 'onboarding'] });
        },
    });
}
