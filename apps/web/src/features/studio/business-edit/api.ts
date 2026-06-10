import type {
    BusinessDocumentUpdateRequest,
    BusinessDocumentUpdateResult,
    PartnerStoreDetailResult,
} from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/partner';

// GET /partner/stores/{storeId} — 사업자 정보 수정 화면 prefill 용 상세 조회.
export function getBusinessEditStudioDetail(storeId: string) {
    return clientApiFetch<PartnerStoreDetailResult>(`${BASE}/stores/${storeId}`, { method: 'GET' });
}

// PATCH /partner/stores/{storeId}/business-document — 사업자 정보 수정(반려 재수정 → 재심사).
export function updateBusinessDocument(storeId: string, body: BusinessDocumentUpdateRequest) {
    return clientApiFetch<BusinessDocumentUpdateResult>(
        `${BASE}/stores/${storeId}/business-document`,
        {
            method: 'PATCH',
            body,
        },
    );
}
