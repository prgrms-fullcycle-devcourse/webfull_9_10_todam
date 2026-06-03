import type {
    BusinessDocumentUpdateRequest,
    BusinessDocumentUpdateResult,
    PartnerStoreDetailResult,
} from '@todam/shared';

import { apiFetch } from '@/shared/api';

// 루트(실 BE) 경로 — MSW(/api/v1) 미가로챔. 공방 등록(루트 BE)으로 생성된 store 를 조회/수정.
const ROOT = '/partner';

// GET /partner/stores/{storeId} — 사업자 정보 수정 화면 prefill 용 상세 조회.
// business-edit 격리: partner-store-detail(mock /api/v1) 과 별개의 getter.
export function getBusinessEditStoreDetail(storeId: string) {
    return apiFetch<PartnerStoreDetailResult>(`${ROOT}/stores/${storeId}`, { method: 'GET' });
}

// PATCH /partner/stores/{storeId}/business-document — 사업자 정보 수정(반려 재수정 → 재심사).
// businessNumber 하이픈은 BE 가 제거하므로 폼 값 그대로 전송.
export function updateBusinessDocument(storeId: string, body: BusinessDocumentUpdateRequest) {
    return apiFetch<BusinessDocumentUpdateResult>(`${ROOT}/stores/${storeId}/business-document`, {
        method: 'PATCH',
        body,
    });
}
