import type {
    GetPartnerCurrentStoreResult,
    PartnerProgramListResult,
    PartnerStoreDetailResult,
    UpdatePartnerCurrentStoreResult,
} from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/partner';

export function getCurrentStudio() {
    return clientApiFetch<GetPartnerCurrentStoreResult>(`${BASE}/me/current-studio`, {
        method: 'GET',
    });
}

export function updateCurrentStudio(storeId: string) {
    return clientApiFetch<UpdatePartnerCurrentStoreResult>(`${BASE}/me/current-studio`, {
        method: 'PATCH',
        body: { storeId },
    });
}

export function getPartnerStudioDetail(storeId: string) {
    return clientApiFetch<PartnerStoreDetailResult>(`${BASE}/stores/${storeId}`, { method: 'GET' });
}

export function getPartnerStudioPrograms(storeId: string) {
    return clientApiFetch<PartnerProgramListResult>(`${BASE}/stores/${storeId}/programs`, {
        method: 'GET',
    });
}
