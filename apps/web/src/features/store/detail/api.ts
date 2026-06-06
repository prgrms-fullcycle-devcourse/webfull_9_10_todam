import { type PartnerProgramListResult, type PartnerStoreDetailResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/partner';

// 내 공방 상세 조회 (파트너센터). 수정화면 preload와 동일 엔드포인트·계약(PartnerStoreDetail).
export function getPartnerStoreDetail(storeId: string) {
    return clientApiFetch<PartnerStoreDetailResult>(`${BASE}/stores/${storeId}`, { method: 'GET' });
}

// 공방 운영 클래스 목록 (파트너센터)
export function getPartnerStorePrograms(storeId: string) {
    return clientApiFetch<PartnerProgramListResult>(`${BASE}/stores/${storeId}/programs`, {
        method: 'GET',
    });
}
