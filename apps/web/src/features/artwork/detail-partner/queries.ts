'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
    UpdateArtworkStatusRequest,
    CreateArtworkPhotosRequest,
    UpdateArtworkDeliveryRequest,
    UpdateArtworkDeliveryInfoRequest,
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
    updateArtworkDeliveryInfo,
} from './api';

const KEY = ['artworks', 'partner', 'detail'] as const;
// 목록·단계별 집계(파트너홈 '제작 중인 작품' 포함) 공통 prefix. 상태 변경 시 함께 무효화.
const ARTWORK_LIST_KEY = ['artworks', 'partner'] as const;
// 작품 상태 전이는 예약 상태(체험완료/배송/픽업)와 연동 → 예약 목록·요약도 무효화.
const PARTNER_RESERVATIONS_KEY = ['partner', 'reservations'] as const;

export function detailQueryKey(artworkId: string) {
    return [...KEY, artworkId] as const;
}

// 작품 상태/배송 변경 후 갱신 대상: 상세 + 목록/집계 + 연동 예약.
function invalidateArtworkRelated(
    queryClient: ReturnType<typeof useQueryClient>,
    artworkId: string,
) {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: detailQueryKey(artworkId) }),
        queryClient.invalidateQueries({ queryKey: ARTWORK_LIST_KEY }),
        queryClient.invalidateQueries({ queryKey: PARTNER_RESERVATIONS_KEY }),
    ]);
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
            await invalidateArtworkRelated(queryClient, artworkId);
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
            await invalidateArtworkRelated(queryClient, artworkId);
            push({ message: '작품 상태가 변경되었습니다.' });
        },
    });
}

// 작품 수령 방식·배송 정보 입력 mutation.
export function useUpdateArtworkDeliveryInfo(artworkId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: UpdateArtworkDeliveryInfoRequest) =>
            updateArtworkDeliveryInfo(artworkId, body),
        onSuccess: async () => {
            await invalidateArtworkRelated(queryClient, artworkId);
        },
    });
}
