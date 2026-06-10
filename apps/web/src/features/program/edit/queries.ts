'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ProgramEditRequest, ProgramImageUploadRequest } from '@todam/shared';

import { confirmProgramImage, deleteProgramImage, patchProgram, postProgramImage } from './api';
import type { PendingImage } from './model/types';
import { uploadToPresignedUrl } from '@/shared/api';

// 프로그램 수정 preload 는 파트너 상세(usePartnerProgramDetail)를 재사용한다.
// 수정/이미지 변경 후 상세·목록 캐시를 무효화해 재조회되게 한다.
const PROGRAMS_KEY = (storeId: string) => ['partner', 'studios', storeId, 'programs'] as const;

// ─── 프로그램 수정 ───────────────────────────────────────────────
export function usePatchProgram(storeId: string, programId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: ProgramEditRequest) => patchProgram(storeId, programId, body),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY(storeId) }),
    });
}

// ─── 이미지 업로드 (presigned → S3 PUT) ─────────────────────────
export function useUploadProgramImage(storeId: string, programId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            pending,
            req,
        }: {
            pending: PendingImage;
            req: ProgramImageUploadRequest;
        }) => {
            const result = await postProgramImage(storeId, programId, req);
            await uploadToPresignedUrl(result.uploadUrl, pending.file);
            await confirmProgramImage(storeId, programId, result.programImageId);
            return result;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY(storeId) }),
    });
}

// ─── 이미지 삭제 ─────────────────────────────────────────────────
export function useDeleteProgramImage(storeId: string, programId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (imageId: string) => deleteProgramImage(storeId, programId, imageId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY(storeId) }),
    });
}
