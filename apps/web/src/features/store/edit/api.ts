import type {
    PartnerStoreDetailResult,
    StoreImageConfirmResult,
    StoreImageUploadRequest,
    StoreImageUploadResult,
    StoreUpdateRequest,
    StoreUpdateResult,
} from '@todam/shared';

import { apiFetch } from '@/shared/api';

// 실 BE 루트 경로(apps/api global prefix 없음). MSW(/api/v1) 미가로챔 → 실 BE.
// store/detail·business-edit 과 동일 패턴. 동일 엔드포인트·계약(PartnerStoreDetail).
const BASE = '/partner';

// GET /partner/stores/{storeId} — 내 공방 상세 (수정 화면 preload)
export function getStoreDetail(storeId: string) {
    return apiFetch<PartnerStoreDetailResult>(`${BASE}/stores/${storeId}`, { method: 'GET' });
}

// PATCH /partner/stores/{storeId} — 공방 정보 수정 (변경 필드만)
export function updateStore(storeId: string, body: StoreUpdateRequest) {
    return apiFetch<StoreUpdateResult>(`${BASE}/stores/${storeId}`, { method: 'PATCH', body });
}

// POST /partner/stores/{storeId}/images — presigned PUT URL 발급
export function requestImageUpload(storeId: string, body: StoreImageUploadRequest) {
    return apiFetch<StoreImageUploadResult>(`${BASE}/stores/${storeId}/images`, {
        method: 'POST',
        body,
    });
}

// S3 PUT (현재 mock). presigned URL 로 직접 업로드.
export async function putToPresignedUrl(uploadUrl: string, file: File) {
    await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
    });
}

// PATCH /partner/stores/{storeId}/images/{imageId}/confirm — PENDING→UPLOADED
export function confirmImageUpload(storeId: string, imageId: string) {
    return apiFetch<StoreImageConfirmResult>(
        `${BASE}/stores/${storeId}/images/${imageId}/confirm`,
        { method: 'PATCH' },
    );
}

// DELETE /partner/stores/{storeId}/images/{imageId}
export function deleteImage(storeId: string, imageId: string) {
    return apiFetch<null>(`${BASE}/stores/${storeId}/images/${imageId}`, { method: 'DELETE' });
}
