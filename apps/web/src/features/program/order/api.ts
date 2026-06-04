import type { PartnerProgramReorderRequest } from '@todam/shared';

import { apiFetch } from '@/shared/api';

import type { PartnerProgramListResultView } from '../list';

const BASE = '/partner';

// 파트너 클래스(프로그램) 순서 변경.
export function reorderPrograms(storeId: string, body: PartnerProgramReorderRequest) {
    return apiFetch<PartnerProgramListResultView>(`${BASE}/stores/${storeId}/programs/order`, {
        method: 'PATCH',
        body,
    });
}
