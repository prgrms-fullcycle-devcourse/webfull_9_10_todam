import {
    DAY_OF_WEEK,
    type BusinessDocumentImageRequest,
    type BusinessDocumentImageResult,
    type ConfirmStoreImageResult,
    type CreateStoreImageRequest,
    type CreateStoreImageResult,
    type CreateStoreRequest,
    type CreateStoreResult,
    type PartnerOnboardingResult,
    type PartnerStoreDetailResult,
    type SlugAvailabilityResult,
    type SubmitStoreResult,
} from '@todam/shared';

import { apiFetch } from '@/shared/api';
import { geocodeAddress, type GeocodeCoords } from '@/shared/lib/kakaoGeocode';

import type { StoreRegistrationForm } from './model/types';

// ─── slug 중복확인 (BE 미존재 — MSW mock 유지) ────────────────────
// 실 BE 에 slug-availability 엔드포인트가 아직 없다(별도 be 후속). 전역 mock(on) 의
// /api/v1 핸들러가 이 경로를 가로채 mock 응답을 준다. 제출 시점 실 BE 의 409 SLUG_CONFLICT 는 별도 연동됨.
const MOCK_BASE = '/api/v1/partner';

export function checkSlug(slug: string) {
    return apiFetch<SlugAvailabilityResult>(
        `${MOCK_BASE}/stores/slug-availability?slug=${encodeURIComponent(slug)}`,
        { method: 'GET' },
    );
}

// 주소 → 좌표 변환. POST /stores 의 latitude/longitude 소스.
// BE 변환 없음(현 contract) → FE 가 Kakao Maps JS SDK 로 직접 변환.
export function geocode(query: string): Promise<GeocodeCoords> {
    return geocodeAddress(query);
}

// ─── 실 API 엔드포인트 (plan API Contract 스냅샷 바인딩) ──────────
const BASE = '/partner';

// 응답: { partnerStatus: PartnerStatus|null, store: {id,status,rejectedReason}|null }
export function getPartnerOnboarding() {
    return apiFetch<PartnerOnboardingResult>(`${BASE}/onboarding`, { method: 'GET' });
}

// 폼 → POST /stores body 매핑.
function toCreateStoreBody(form: StoreRegistrationForm): CreateStoreRequest {
    const fullAddress = `${form.business.businessAddress} ${form.business.addressDetail}`.trim();
    return {
        name: form.store.name,
        slug: form.store.slug || undefined,
        description: form.store.description || null,
        phone: form.store.phone,
        address: fullAddress,
        latitude: form.business.latitude ?? 0,
        longitude: form.business.longitude ?? 0,
        convenienceInfo: { ...form.store.convenienceInfo },
        autoConfirm: form.reservation.autoConfirm ?? false,
        cancelDeadlineDays: form.reservation.cancelDeadlineDays,
        reservationIntervalMinutes: form.reservation.intervalMinutes as 60 | 90 | 120 | 180,
        maxCapacityPerSlot: form.reservation.maxCapacity,
        operatingHours: [...form.operating.businessDays]
            .sort((a, b) => a - b)
            .map((day) => ({
                dayOfWeek: DAY_OF_WEEK[day]!,
                openTime: form.operating.openTime,
                closeTime: form.operating.closeTime,
                breakStart: form.operating.breakStart || null,
                breakEnd: form.operating.breakEnd || null,
            })),
        // 사업자등록증 파일은 IN scope(파일 저장). OCR/진위확인만 백로그.
        // documentUrl 은 BusinessStep 에서 실 presigned 업로드로 발급받아 폼에 보관된 S3 URL.
        businessDocument: {
            // BE 는 하이픈 없이 숫자 10자리 요구. 폼은 하이픈 포함 표시(000-00-00000) → 전송 직전 strip.
            businessNumber: form.business.businessNumber.replace(/-/g, ''),
            businessName: form.business.businessName,
            ownerName: form.business.ownerName,
            businessAddress: fullAddress,
            email: form.business.email || null,
            documentUrl: form.business.documentUrl,
        },
    };
}

// 1) 공방 초안 생성
export function createStore(form: StoreRegistrationForm) {
    return apiFetch<CreateStoreResult>('/stores', {
        method: 'POST',
        body: toCreateStoreBody(form),
    });
}

// 1-1) 사업자등록증 presigned PUT URL 발급 (store-비종속, 루트 경로 → MSW(/api/v1) 미가로챔, 실 BE).
export function createBusinessDocumentImage(body: BusinessDocumentImageRequest) {
    return apiFetch<BusinessDocumentImageResult>(`${BASE}/business-documents/images`, {
        method: 'POST',
        body,
    });
}

// 2) 공방 이미지 presigned PUT URL 발급
export function createStoreImage(storeId: string, body: CreateStoreImageRequest) {
    return apiFetch<CreateStoreImageResult>(`${BASE}/stores/${storeId}/images`, {
        method: 'POST',
        body,
    });
}

// presigned URL 로 S3 직접 PUT 업로드
export async function uploadToPresignedUrl(
    uploadUrl: string,
    file: File,
    contentType: string,
): Promise<void> {
    const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
    });
    if (!res.ok) {
        throw new Error(`S3 업로드 실패 (${res.status})`);
    }
}

// 3) 업로드 완료 확인 (PENDING → UPLOADED)
export function confirmStoreImage(storeId: string, imageId: string) {
    return apiFetch<ConfirmStoreImageResult>(
        `${BASE}/stores/${storeId}/images/${imageId}/confirm`,
        { method: 'PATCH' },
    );
}

// 4) 공방 심사 제출 (DRAFT/REJECTED → PENDING)
export function submitStore(storeId: string) {
    return apiFetch<SubmitStoreResult>(`${BASE}/stores/${storeId}/submit`, { method: 'POST' });
}

// 검수 상태/반려 사유 조회 = 공방 상세 조회 재사용 (GET /partner/stores/{storeId}).
export function getStoreReviewStatus(storeId: string) {
    return apiFetch<PartnerStoreDetailResult>(`${BASE}/stores/${storeId}`, { method: 'GET' });
}
