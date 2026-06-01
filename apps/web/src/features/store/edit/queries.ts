'use client';

import type { StoreUpdateRequest } from '@todam/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    confirmImageUpload,
    deleteImage,
    getStoreDetail,
    putToPresignedUrl,
    requestImageUpload,
    updateStore,
} from './api';

const KEY = ['partner', 'store'] as const;

// 공방 상세 (수정 화면 preload)
export function useStoreDetail(storeId: string) {
    return useQuery({
        queryKey: [...KEY, storeId],
        queryFn: () => getStoreDetail(storeId),
        enabled: !!storeId,
        staleTime: 0,
    });
}

// 공방 정보 수정
export function useUpdateStore(storeId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: StoreUpdateRequest) => updateStore(storeId, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...KEY, storeId] });
        },
    });
}

// 이미지 추가: presigned 발급 → S3 PUT → confirm. 최종 id 반환.
export function useAddStoreImage(storeId: string) {
    return useMutation({
        mutationFn: async ({ file, isThumbnail }: { file: File; isThumbnail: boolean }) => {
            const presigned = await requestImageUpload(storeId, {
                fileName: file.name,
                fileType: file.type,
                isThumbnail,
            });
            await putToPresignedUrl(presigned.uploadUrl, file);
            await confirmImageUpload(storeId, presigned.imageId);
            return { id: presigned.imageId, imageUrl: presigned.imageUrl };
        },
    });
}

// 이미지 삭제 (X 클릭 시)
export function useDeleteStoreImage(storeId: string) {
    return useMutation({
        mutationFn: (imageId: string) => deleteImage(storeId, imageId),
    });
}
