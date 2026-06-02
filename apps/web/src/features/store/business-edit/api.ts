import type { BusinessDocumentUpdateRequest, BusinessDocumentUpdateResult } from '@todam/shared';

import { apiFetch } from '@/shared/api';

const BASE = '/api/v1/partner';

// PATCH /partner/stores/{storeId}/business-document — 사업자 정보 수정(반려 재수정 → 재심사)
export function updateBusinessDocument(storeId: string, body: BusinessDocumentUpdateRequest) {
    return apiFetch<BusinessDocumentUpdateResult>(`${BASE}/stores/${storeId}/business-document`, {
        method: 'PATCH',
        body,
    });
}
