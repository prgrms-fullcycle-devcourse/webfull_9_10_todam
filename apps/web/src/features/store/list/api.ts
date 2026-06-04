import { type PartnerStoreListResult } from '@todam/shared';

import { apiFetch } from '@/shared/api';

// 내 공방 목록 조회 (파트너센터). 가드: AuthGuard + PartnerGuard(APPROVED).
export function getPartnerStores() {
    return apiFetch<PartnerStoreListResult>('/partner/stores', { method: 'GET' });
}
