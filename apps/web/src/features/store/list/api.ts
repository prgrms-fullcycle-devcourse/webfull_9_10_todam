import { type PartnerStoreListResult } from '@todam/shared';

import { apiFetch } from '@/shared/api';

const BASE = '/api/v1/partner';

// 내 공방 목록 조회 (파트너센터)
export function getPartnerStores() {
    return apiFetch<PartnerStoreListResult>(`${BASE}/stores`, { method: 'GET' });
}
