'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { isBusinessDocumentFileType } from '@todam/shared';

import { uploadToPresignedUrl } from '@/shared/api';

import {
    checkSlug,
    confirmStudioImage,
    createBusinessDocumentImage,
    createStudio,
    createStudioImage,
    geocode,
    getPartnerOnboarding,
    getStudioReviewStatus,
    ocrBusinessDocument,
    submitStudio,
    verifyBusinessDocument,
} from './api';
import type { BusinessDocumentVerifyRequest } from '@todam/shared';
import type { StudioRegistrationForm } from './model/types';

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
            // 사업자등록증은 JPEG/PNG만 허용(PDF 등은 OCR 불가) — 업로드 전 차단.
            if (!isBusinessDocumentFileType(file.type)) {
                throw new Error('사업자등록증은 JPEG 또는 PNG 이미지만 업로드할 수 있어요.');
            }
            const { uploadUrl, documentUrl } = await createBusinessDocumentImage({
                fileName: file.name,
                fileType: file.type,
            });
            await uploadToPresignedUrl(uploadUrl, file, file.type);
            return { documentUrl };
        },
    });
}

// 사업자등록증 OCR: 업로드된 documentUrl 로 필드 자동추출(필드별 nullable, 미추출은 null).
export function useOcrBusinessDocument() {
    return useMutation({ mutationFn: (documentUrl: string) => ocrBusinessDocument(documentUrl) });
}

// 사업자등록증 진위확인(국세청 동기 게이트). 1단계 "다음" 클릭 시 호출.
export function useVerifyBusinessDocument() {
    return useMutation({
        mutationFn: (body: BusinessDocumentVerifyRequest) => verifyBusinessDocument(body),
    });
}

// 공방 등록 제출 = 초안 생성 → 이미지 presigned 업로드/확인 → 심사 제출 오케스트레이션.
// 반환: 생성된 storeId (완료 화면 상태 조회용).
export function useSubmitStudioRegistration() {
    return useMutation({
        mutationFn: async (form: StudioRegistrationForm): Promise<{ storeId: string }> => {
            // 1) 공방 초안 생성 (status = DRAFT)
            const { store } = await createStudio(form);
            const storeId = store.id;

            // 2) 대표 이미지 presigned 업로드 → S3 PUT → confirm. 순차 처리(만료/경합 회피).
            for (const image of form.store.images) {
                const { imageId, uploadUrl } = await createStudioImage(storeId, {
                    fileName: image.file.name,
                    fileType: image.file.type,
                    isThumbnail: image.isThumbnail,
                });
                await uploadToPresignedUrl(uploadUrl, image.file, image.file.type);
                await confirmStudioImage(storeId, imageId);
            }

            // 3) 심사 제출 (DRAFT → PENDING)
            await submitStudio(storeId);

            // 타임슬롯은 조회/예약 시 영업시간 기준으로 계산되므로 등록 시 별도 생성하지 않는다.
            return { storeId };
        },
    });
}

// 검수 상태/반려 사유 조회 (GET /partner/stores/{storeId})
export function useStudioReviewStatus(storeId: string | null) {
    return useQuery({
        queryKey: [...KEY, 'review', storeId ?? 'none'],
        queryFn: () => getStudioReviewStatus(storeId!),
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
