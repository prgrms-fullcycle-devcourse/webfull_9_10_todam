import { type PartnerProgramListResult, type PartnerStoreDetailResult } from '@todam/shared';

import { apiFetch } from '@/shared/api';

// 실 BE 루트 경로(apps/api global prefix 없음). MSW(/api/v1) 미가로챔 → 실 BE.
// 내 공방 상세 조회 (파트너센터). 수정화면 preload와 동일 엔드포인트·계약(PartnerStoreDetail).
export function getPartnerStoreDetail(storeId: string) {
    return apiFetch<PartnerStoreDetailResult>(`/partner/stores/${storeId}`, { method: 'GET' });
}

// 공방 운영 클래스 목록 (파트너센터)
export function getPartnerStorePrograms(storeId: string) {
    return apiFetch<PartnerProgramListResult>(`/partner/stores/${storeId}/programs`, {
        method: 'GET',
    });
}
