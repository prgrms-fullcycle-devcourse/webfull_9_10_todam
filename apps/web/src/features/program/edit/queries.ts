'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import type { ProgramEditRequest, ProgramImageUploadRequest } from '@todam/shared';

import {
    deleteProgramImage,
    getProgramDetail,
    patchProgram,
    postProgramImage,
    uploadToS3,
} from './api';
import type { PendingImage } from './model/types';

const KEY = ['program'] as const;

// ─── 프로그램 상세 (preload) ─────────────────────────────────────
export function useProgramDetail(slug: string, programId: string) {
    return useQuery({
        queryKey: [...KEY, 'detail', slug, programId],
        queryFn: () => getProgramDetail(slug, programId),
        enabled: !!slug && !!programId,
        staleTime: 30_000,
    });
}

// ─── 프로그램 수정 ───────────────────────────────────────────────
export function usePatchProgram(storeId: string, programId: string) {
    return useMutation({
        mutationFn: (body: ProgramEditRequest) => patchProgram(storeId, programId, body),
    });
}

// ─── 이미지 업로드 (presigned → S3 PUT) ─────────────────────────
export function useUploadProgramImage(storeId: string, programId: string) {
    return useMutation({
        mutationFn: async ({
            pending,
            req,
        }: {
            pending: PendingImage;
            req: ProgramImageUploadRequest;
        }) => {
            const result = await postProgramImage(storeId, programId, req);
            await uploadToS3(result.uploadUrl, pending.file);
            return result;
        },
    });
}

// ─── 이미지 삭제 ─────────────────────────────────────────────────
export function useDeleteProgramImage(storeId: string, programId: string) {
    return useMutation({
        mutationFn: (imageId: string) => deleteProgramImage(storeId, programId, imageId),
    });
}
