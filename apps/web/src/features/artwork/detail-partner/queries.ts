'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
    UpdateArtworkStatusRequest,
    CreateArtworkPhotosRequest,
    UpdateArtworkDeliveryRequest,
} from '@todam/shared';

import { ApiError } from '@/shared/api';
import { useToast } from '@/shared/model';

import {
    getPartnerArtworkDetail,
    updateArtworkStatus,
    createArtworkPhotos,
    confirmArtworkPhoto,
    deleteArtworkPhoto,
    updateArtworkDelivery,
} from './api';

const KEY = ['artworks', 'partner', 'detail'] as const;

export function detailQueryKey(artworkId: string) {
    return [...KEY, artworkId] as const;
}

// 파트너 작품 상세 조회 훅.
// 401/403/404 는 자동 재시도 비활성.
export function usePartnerArtworkDetail(artworkId: string) {
    return useQuery({
        queryKey: detailQueryKey(artworkId),
        queryFn: () => getPartnerArtworkDetail(artworkId),
        staleTime: 30_000,
        // 작품 상태는 예약(체험완료)·배송 등 외부 플로우로도 바뀐다.
        // 상세 재진입 시 항상 최신 반영(캐시 즉시표시 + 백그라운드 refetch).
        refetchOnMount: 'always',
        retry: (failureCount, error) => {
            if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) {
                return false;
            }
            return failureCount < 2;
        },
        enabled: Boolean(artworkId),
    });
}

// 작품 상태 변경 mutation.
export function useUpdateArtworkStatus(artworkId: string) {
    const queryClient = useQueryClient();
    const { push } = useToast();

    return useMutation({
        mutationFn: (body: UpdateArtworkStatusRequest) => updateArtworkStatus(artworkId, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: detailQueryKey(artworkId) });
            push({ message: '작품 상태가 변경되었습니다.' });
        },
    });
}

// 사진 presigned URL 발급 mutation.
export function usePhotoPresign(artworkId: string) {
    return useMutation({
        mutationFn: (body: CreateArtworkPhotosRequest) => createArtworkPhotos(artworkId, body),
    });
}

// 사진 업로드 확정 mutation.
export function useConfirmArtworkPhoto(artworkId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (photoId: string) => confirmArtworkPhoto(artworkId, photoId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: detailQueryKey(artworkId) });
        },
    });
}

// 사진 삭제 mutation.
export function useDeleteArtworkPhoto(artworkId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (photoId: string) => deleteArtworkPhoto(artworkId, photoId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: detailQueryKey(artworkId) });
        },
    });
}

// 배송/픽업 처리 mutation.
export function useUpdateArtworkDelivery(artworkId: string) {
    const queryClient = useQueryClient();
    const { push } = useToast();

    return useMutation({
        mutationFn: (body: UpdateArtworkDeliveryRequest) => updateArtworkDelivery(artworkId, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: detailQueryKey(artworkId) });
            push({ message: '작품 상태가 변경되었습니다.' });
        },
    });
}
