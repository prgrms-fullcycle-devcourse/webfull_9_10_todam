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
} from './api';
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

            // 타임슬롯 자동 생성은 어드민 승인(APPROVED) 시점으로 이관.
            // 등록 직후엔 PENDING 이라 time-slots/generate(PartnerGuard) 가 403 → 로그인 모달 오작동.
            // PENDING 공방은 예약을 받지 않으므로 타임슬롯 불필요. 승인 트랜잭션에서 status 전환과 함께 생성한다.
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
