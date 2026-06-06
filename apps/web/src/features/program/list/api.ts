import type { PartnerProgramListResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/partner';

// 파트너 클래스(프로그램) 목록 조회.
export function getPartnerPrograms(storeId: string) {
    return clientApiFetch<PartnerProgramListResult>(`${BASE}/stores/${storeId}/programs`, {
        method: 'GET',
    });
}
