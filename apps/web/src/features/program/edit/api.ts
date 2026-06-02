import type {
    ProgramDetailResult,
    ProgramEditRequest,
    ProgramEditResult,
    ProgramImageUploadRequest,
    ProgramImageUploadResult,
} from '@todam/shared';

import { apiFetch } from '../../../shared/api';

const BASE = '/api/v1';

// ─── 프로그램 상세 조회 (preload용) ─────────────────────────────
// GET /stores/{slug}/programs/{programId}
export function getProgramDetail(slug: string, programId: string) {
    return apiFetch<ProgramDetailResult>(
        `${BASE}/stores/${encodeURIComponent(slug)}/programs/${encodeURIComponent(programId)}`,
        { method: 'GET' },
    );
}

// ─── 프로그램 수정 ───────────────────────────────────────────────
// PATCH /partner/stores/{storeId}/programs/{programId}
export function patchProgram(storeId: string, programId: string, body: ProgramEditRequest) {
    return apiFetch<ProgramEditResult>(`${BASE}/partner/stores/${storeId}/programs/${programId}`, {
        method: 'PATCH',
        body,
    });
}

// ─── 이미지 Pre-signed URL 발급 ──────────────────────────────────
// POST /partner/stores/{storeId}/programs/{programId}/images
export function postProgramImage(
    storeId: string,
    programId: string,
    body: ProgramImageUploadRequest,
) {
    return apiFetch<ProgramImageUploadResult>(
        `${BASE}/partner/stores/${storeId}/programs/${programId}/images`,
        { method: 'POST', body },
    );
}

// ─── 이미지 삭제 ─────────────────────────────────────────────────
// DELETE /partner/stores/{storeId}/programs/{programId}/images/{imageId}
export function deleteProgramImage(storeId: string, programId: string, imageId: string) {
    return apiFetch<null>(
        `${BASE}/partner/stores/${storeId}/programs/${programId}/images/${imageId}`,
        { method: 'DELETE' },
    );
}

// ─── S3 직접 업로드 ──────────────────────────────────────────────
// Pre-signed URL로 PUT (Authorization 헤더 제외 필요)
export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
    const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
    });
    if (!res.ok) {
        throw new Error(`S3 업로드 실패: ${res.status}`);
    }
}
