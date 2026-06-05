import type {
    ConfirmProgramImageResult,
    ProgramEditRequest,
    ProgramEditResult,
    ProgramImageUploadRequest,
    ProgramImageUploadResult,
} from '@todam/shared';

import { apiFetch } from '@/shared/api';

// 실 BE 루트 경로(global prefix 없음). store 도메인 컨벤션(features/program/detail) 동일.
const BASE = '/partner';

// ─── 프로그램 수정 ───────────────────────────────────────────────
// PATCH /partner/stores/{storeId}/programs/{programId}
export function patchProgram(storeId: string, programId: string, body: ProgramEditRequest) {
    return apiFetch<ProgramEditResult>(
        `${BASE}/stores/${encodeURIComponent(storeId)}/programs/${encodeURIComponent(programId)}`,
        { method: 'PATCH', body },
    );
}

// ─── 이미지 Pre-signed URL 발급 ──────────────────────────────────
// POST /partner/stores/{storeId}/programs/{programId}/images
export function postProgramImage(
    storeId: string,
    programId: string,
    body: ProgramImageUploadRequest,
) {
    return apiFetch<ProgramImageUploadResult>(
        `${BASE}/stores/${encodeURIComponent(storeId)}/programs/${encodeURIComponent(programId)}/images`,
        { method: 'POST', body },
    );
}

// ─── 이미지 삭제 ─────────────────────────────────────────────────
// DELETE /partner/stores/{storeId}/programs/{programId}/images/{imageId}
export function deleteProgramImage(storeId: string, programId: string, imageId: string) {
    return apiFetch<null>(
        `${BASE}/stores/${encodeURIComponent(storeId)}/programs/${encodeURIComponent(programId)}/images/${encodeURIComponent(imageId)}`,
        { method: 'DELETE' },
    );
}

// ─── 이미지 업로드 확인 (PENDING → UPLOADED) ─────────────────────
// PATCH /partner/stores/{storeId}/programs/{programId}/images/{imageId}/confirm
export function confirmProgramImage(storeId: string, programId: string, imageId: string) {
    return apiFetch<ConfirmProgramImageResult>(
        `${BASE}/stores/${encodeURIComponent(storeId)}/programs/${encodeURIComponent(programId)}/images/${encodeURIComponent(imageId)}/confirm`,
        { method: 'PATCH' },
    );
}
