'use client';

import type { StoreUpdateRequest } from '@todam/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    checkSlug,
    confirmImageUpload,
    deleteImage,
    getStudioDetail,
    putToPresignedUrl,
    requestImageUpload,
    updateStudio,
} from './api';

const KEY = ['partner', 'studio'] as const;

// 공방 상세 (수정 화면 preload)
export function useStudioDetail(storeId: string) {
    return useQuery({
        queryKey: [...KEY, storeId],
        queryFn: () => getStudioDetail(storeId),
        enabled: !!storeId,
        staleTime: 0,
    });
}

// 공방 URL 사전 중복확인 (debounced slug 를 enabled 로 제어, 본인 store 제외)
export function useSlugAvailability(storeId: string, slug: string, enabled: boolean) {
    return useQuery({
        queryKey: [...KEY, storeId, 'slug', slug],
        queryFn: () => checkSlug(slug, storeId),
        enabled: enabled && !!storeId,
        staleTime: 0,
    });
}

// 공방 정보 수정
export function useUpdateStudio(storeId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: StoreUpdateRequest) => updateStudio(storeId, body),
        onSuccess: () => {
            // edit 전용 preload 키.
            qc.invalidateQueries({ queryKey: [...KEY, storeId] });
            // 공방 상세(detail feature: ['partner','studios',storeId]) + 운영 클래스 등 파생.
            qc.invalidateQueries({ queryKey: ['partner', 'studios'] });
            // 전환시트·홈 카드가 읽는 소유 공방 목록(이름 변경 반영).
            qc.invalidateQueries({ queryKey: ['partner', 'current-studio'] });
        },
    });
}

// 이미지 추가: presigned 발급 → S3 PUT → confirm. 최종 id 반환.
export function useAddStudioImage(storeId: string) {
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
export function useDeleteStudioImage(storeId: string) {
    return useMutation({
        mutationFn: (imageId: string) => deleteImage(storeId, imageId),
    });
}
