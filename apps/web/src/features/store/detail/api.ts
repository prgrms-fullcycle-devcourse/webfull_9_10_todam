import {
    type PartnerProgramListResult,
    type StoreDetailResult,
} from '@todam/shared';

import { apiFetch } from '../../../shared/api';

const BASE = '/api/v1/partner';

// 내 공방 상세 조회 (파트너센터)
export function getPartnerStoreDetail(storeId: string) {
    return apiFetch<StoreDetailResult>(`${BASE}/stores/${storeId}`, { method: 'GET' });
}

// 공방 운영 클래스 목록 (파트너센터)
export function getPartnerStorePrograms(storeId: string) {
    return apiFetch<PartnerProgramListResult>(`${BASE}/stores/${storeId}/programs`, {
        method: 'GET',
    });
}
