import type { PartnerProgramListResult } from '@todam/shared';

import { apiFetch } from '@/shared/api';

const BASE = '/partner';

// 파트너 클래스(프로그램) 목록 조회.
export function getPartnerPrograms(storeId: string) {
    return apiFetch<PartnerProgramListResult>(`${BASE}/stores/${storeId}/programs`, {
        method: 'GET',
    });
}
