import { type PartnerStoreListResult } from '@todam/shared';

import { apiFetch } from '@/shared/api';

// 실 BE 루트 경로(apps/api global prefix 없음). MSW(/api/v1) 미가로챔 → 실 BE.
// 내 공방 목록 조회 (파트너센터). 가드: AuthGuard + PartnerGuard(APPROVED).
export function getPartnerStores() {
    return apiFetch<PartnerStoreListResult>('/partner/stores', { method: 'GET' });
}
