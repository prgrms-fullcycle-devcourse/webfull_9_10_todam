import type { GetPartnerCurrentStoreResult, UpdatePartnerCurrentStoreResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

// 실 BE 경로 규칙 = '/partner/...' (글로벌 prefix 없음). '/api/v1'은 MSW mock 가로채기용 → 사용 금지.
const BASE = '/partner';

// GET /partner/me/current-store
export function getCurrentStore() {
    return clientApiFetch<GetPartnerCurrentStoreResult>(`${BASE}/me/current-store`, {
        method: 'GET',
    });
}

// PATCH /partner/me/current-store
export function updateCurrentStore(storeId: string) {
    return clientApiFetch<UpdatePartnerCurrentStoreResult>(`${BASE}/me/current-store`, {
        method: 'PATCH',
        body: { storeId },
    });
}
