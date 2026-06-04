'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { uploadToPresignedUrl } from '@/shared/api';

import {
    checkSlug,
    confirmStoreImage,
    createBusinessDocumentImage,
    createStore,
    createStoreImage,
    geocode,
    getPartnerOnboarding,
    getStoreReviewStatus,
    submitStore,
} from './api';
import type { StoreRegistrationForm } from './model/types';

const KEY = ['partner', 'onboarding'] as const;

// 공방 URL 중복확인 (debounced slug 를 enabled 로 제어)
export function useSlugAvailability(slug: string, enabled: boolean) {
    return useQuery({
        queryKey: [...KEY, 'slug', slug],
        queryFn: () => checkSlug(slug),
        enabled,
        staleTime: 0,
    });
}

// 주소 → 좌표
export function useGeocode() {
    return useMutation({ mutationFn: (query: string) => geocode(query) });
}

// 사업자등록증 실 업로드: presigned 발급 → S3 직접 PUT → 발급된 documentUrl 반환.
export function useUploadBusinessDocument() {
    return useMutation({
        mutationFn: async (file: File): Promise<{ documentUrl: string }> => {
            const { uploadUrl, documentUrl } = await createBusinessDocumentImage({
                fileName: file.name,
                fileType: file.type,
            });
            await uploadToPresignedUrl(uploadUrl, file, file.type);
            return { documentUrl };
        },
    });
}

// 공방 등록 제출 = 초안 생성 → 이미지 presigned 업로드/확인 → 심사 제출 오케스트레이션.
// 반환: 생성된 storeId (완료 화면 상태 조회용).
export function useSubmitStoreRegistration() {
    return useMutation({
        mutationFn: async (form: StoreRegistrationForm): Promise<{ storeId: string }> => {
            // 1) 공방 초안 생성 (status = DRAFT)
            const { store } = await createStore(form);
            const storeId = store.id;

            // 2) 대표 이미지 presigned 업로드 → S3 PUT → confirm. 순차 처리(만료/경합 회피).
            for (const image of form.store.images) {
                const { imageId, uploadUrl } = await createStoreImage(storeId, {
                    fileName: image.file.name,
                    fileType: image.file.type,
                    isThumbnail: image.isThumbnail,
                });
                await uploadToPresignedUrl(uploadUrl, image.file, image.file.type);
                await confirmStoreImage(storeId, imageId);
            }

            // 3) 심사 제출 (DRAFT → PENDING)
            await submitStore(storeId);

            return { storeId };
        },
    });
}

// 검수 상태/반려 사유 조회 (GET /partner/stores/{storeId})
export function useStoreReviewStatus(storeId: string | null) {
    return useQuery({
        queryKey: [...KEY, 'review', storeId ?? 'none'],
        queryFn: () => getStoreReviewStatus(storeId!),
        enabled: Boolean(storeId),
    });
}

// 온보딩 상태 조회 (검수중/반려 영속화). 게이트 진입 시 1회 조회용.
// enabled=false 면 비-게이트 영역(고객 라우트)에서 불필요 조회 방지.
export function usePartnerOnboarding(enabled = true) {
    return useQuery({
        queryKey: [...KEY, 'onboarding'],
        queryFn: getPartnerOnboarding,
        enabled,
    });
}
