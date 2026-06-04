import type {
    ConfirmProgramImageResult,
    CreateProgramRequest,
    CreateProgramResult,
    PartnerStoreListResult,
    ProgramImageUploadRequest,
    ProgramImageUploadResult,
    UpdateProgramStatusRequest,
    UpdateProgramStatusResult,
} from '@todam/shared';

import { apiFetch } from '@/shared/api';

// 클래스 등록 api 연동 완료
const BASE = '/partner';

// 파트너 공방 목록 조회 (공방 선택용)
// GET /partner/stores
export function getPartnerStores() {
    return apiFetch<PartnerStoreListResult>(`${BASE}/stores`, { method: 'GET' });
}

// ① 클래스 등록 (ACTIVE 직접 생성)
// POST /partner/stores/{storeId}/programs
export function createProgram(storeId: string, body: CreateProgramRequest) {
    return apiFetch<CreateProgramResult>(`${BASE}/stores/${storeId}/programs`, {
        method: 'POST',
        body,
    });
}

// ② 이미지 presigned PUT URL 발급 (program_images status=PENDING 선생성)
// POST /partner/stores/{storeId}/programs/{programId}/images
export function createProgramImage(
    storeId: string,
    programId: string,
    body: ProgramImageUploadRequest,
) {
    return apiFetch<ProgramImageUploadResult>(
        `${BASE}/stores/${storeId}/programs/${programId}/images`,
        { method: 'POST', body },
    );
}

// ④ 업로드 완료 확인 (PENDING → UPLOADED)
// PATCH /partner/stores/{storeId}/programs/{programId}/images/{imageId}/confirm
export function confirmProgramImage(storeId: string, programId: string, imageId: string) {
    return apiFetch<ConfirmProgramImageResult>(
        `${BASE}/stores/${storeId}/programs/${programId}/images/${imageId}/confirm`,
        { method: 'PATCH' },
    );
}

// 상태 변경 (초기 등록 플로우 미사용 — ACTIVE→INACTIVE 등 전이용. contract 바인딩 유지)
// PATCH /partner/stores/{storeId}/programs/{programId}/status
export function updateProgramStatus(
    storeId: string,
    programId: string,
    body: UpdateProgramStatusRequest,
) {
    return apiFetch<UpdateProgramStatusResult>(
        `${BASE}/stores/${storeId}/programs/${programId}/status`,
        { method: 'PATCH', body },
    );
}
