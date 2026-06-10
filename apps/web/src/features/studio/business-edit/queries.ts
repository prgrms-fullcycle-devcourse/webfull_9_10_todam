'use client';

import { isBusinessDocumentFileType, type BusinessDocumentUpdateRequest } from '@todam/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { uploadToPresignedUrl } from '@/shared/api';

import { createBusinessDocumentImage } from '../registration/api';
import { getBusinessEditStudioDetail, updateBusinessDocument } from './api';

// 사업자등록증 실 업로드(등록 BusinessStep 과 동일 패턴): presigned 발급 → S3 직접 PUT → documentUrl 반환.
// 업로드 함수는 store-비종속이라 registration/api 의 것을 그대로 재사용(중복 정의 회피).
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

// business-edit 전용 queryKey 격리 (partner-store-detail mock 캐시와 분리).
const KEY = ['business-edit', 'studio'] as const;

// 사업자 정보 수정 화면 prefill 용 상세 조회 (GET /partner/stores/{storeId}, 실 BE).
export function useBusinessEditStudioDetail(storeId: string) {
    return useQuery({
        queryKey: [...KEY, storeId],
        queryFn: () => getBusinessEditStudioDetail(storeId),
        enabled: Boolean(storeId),
    });
}

// 사업자 정보 수정. 성공 시:
//  - business-edit 상세 캐시 무효화(상태 PENDING 전이 반영)
export function useUpdateBusinessDocument(storeId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: BusinessDocumentUpdateRequest) => updateBusinessDocument(storeId, body),
        // 캐시 stale 표시만. 실제 fresh 보장은 화면 전환 직전 refetchOnboardingThenGo() 에서 await.
        // (검수중/반려 화면으로 네비하기 전에 그 화면이 읽는 쿼리를 미리 fresh 시켜 깜빡임 원천 차단.)
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...KEY, storeId] });
            qc.invalidateQueries({ queryKey: ['partner', 'onboarding'] });
        },
    });
}

// 저장 후 네비 직전 호출: 검수중/반려 화면이 읽는 onboarding 네임스페이스 쿼리(onboarding + review)를
// inactive 포함 전부 refetch 완료까지 await → 목적지 화면이 처음부터 PENDING(검수중)으로 렌더.
export function useRefreshOnboardingThenGo() {
    const qc = useQueryClient();
    return () => qc.refetchQueries({ queryKey: ['partner', 'onboarding'], type: 'all' });
}
