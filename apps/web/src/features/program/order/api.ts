import type { PartnerProgramListResult, PartnerProgramReorderRequest } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/partner';

// 파트너 클래스(프로그램) 순서 변경.
export function reorderPrograms(storeId: string, body: PartnerProgramReorderRequest) {
    return clientApiFetch<PartnerProgramListResult>(`${BASE}/stores/${storeId}/programs/order`, {
        method: 'PATCH',
        body,
    });
}
