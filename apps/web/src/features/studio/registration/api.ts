import {
    DAY_OF_WEEK,
    type BusinessDocumentImageRequest,
    type BusinessDocumentImageResult,
    type BusinessDocumentOcrResult,
    type BusinessDocumentVerifyRequest,
    type BusinessDocumentVerifyResult,
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

import { clientApiFetch } from '@/shared/api';
import { geocodeAddress, type GeocodeCoords } from '@/shared/lib/kakaoGeocode';

import type { StudioRegistrationForm } from './model/types';

// ─── slug 사전 중복확인
// 등록은 신규 공방이므로 excludeStoreId 없음. 제출 시점 최종검증은 POST /stores 409 SLUG_CONFLICT
export function checkSlug(slug: string) {
    return clientApiFetch<SlugAvailabilityResult>(
        `/stores/slug-availability?slug=${encodeURIComponent(slug)}`,
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
    return clientApiFetch<PartnerOnboardingResult>(`${BASE}/onboarding`, { method: 'GET' });
}

// 폼 → POST /stores body 매핑.
function toCreateStudioBody(form: StudioRegistrationForm): CreateStoreRequest {
    // 공방 운영 주소(고객 노출·위치기반) = store.address + 좌표.
    const storeAddress = `${form.store.address} ${form.store.addressDetail}`.trim();
    return {
        name: form.store.name,
        slug: form.store.slug || undefined,
        description: form.store.description || null,
        phone: form.store.phone,
        address: storeAddress,
        latitude: form.store.latitude ?? 0,
        longitude: form.store.longitude ?? 0,
        regionSido: form.store.regionSido,
        regionSigungu: form.store.regionSigungu,
        regionDong: form.store.regionDong,
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
        businessDocument: {
            businessNumber: form.business.businessNumber.replace(/-/g, ''),
            businessName: form.business.businessName,
            ownerName: form.business.ownerName,
            startDate: form.business.startDate || null,
            businessAddress: form.business.businessAddress.trim(),
            email: form.business.email || null,
            documentUrl: form.business.documentUrl,
        },
    };
}

// 1) 공방 초안 생성
export function createStudio(form: StudioRegistrationForm) {
    return clientApiFetch<CreateStoreResult>('/stores', {
        method: 'POST',
        body: toCreateStudioBody(form),
    });
}

// 1-1) 사업자등록증 presigned PUT URL 발급 (store-비종속, 루트 경로 → MSW(/api/v1) 미가로챔, 실 BE).
export function createBusinessDocumentImage(body: BusinessDocumentImageRequest) {
    return clientApiFetch<BusinessDocumentImageResult>(`${BASE}/business-documents/images`, {
        method: 'POST',
        body,
    });
}

// 1-2) 사업자등록증 OCR — 업로드된 documentUrl 로 Vision 파싱 결과(필드별 nullable) 반환.
export function ocrBusinessDocument(documentUrl: string) {
    return clientApiFetch<BusinessDocumentOcrResult>(`${BASE}/business-documents/ocr`, {
        method: 'POST',
        body: { documentUrl },
    });
}

// 1-3) 사업자등록증 진위확인 — 국세청 동기 게이트(stateless). 1단계 "다음" 클릭 시 호출.
// 응답은 200 고정(MISMATCH/ERROR도 200) → message 키로 FE 분기. 차단은 message 판정으로 처리.
export function verifyBusinessDocument(body: BusinessDocumentVerifyRequest) {
    return clientApiFetch<BusinessDocumentVerifyResult>(`${BASE}/business-documents/verify`, {
        method: 'POST',
        body,
    });
}

// 2) 공방 이미지 presigned PUT URL 발급
export function createStudioImage(storeId: string, body: CreateStoreImageRequest) {
    return clientApiFetch<CreateStoreImageResult>(`${BASE}/stores/${storeId}/images`, {
        method: 'POST',
        body,
    });
}

// 3) 업로드 완료 확인 (PENDING → UPLOADED)
export function confirmStudioImage(storeId: string, imageId: string) {
    return clientApiFetch<ConfirmStoreImageResult>(
        `${BASE}/stores/${storeId}/images/${imageId}/confirm`,
        { method: 'PATCH' },
    );
}

// 4) 공방 심사 제출 (DRAFT/REJECTED → PENDING)
export function submitStudio(storeId: string) {
    return clientApiFetch<SubmitStoreResult>(`${BASE}/stores/${storeId}/submit`, {
        method: 'POST',
    });
}

// 검수 상태/반려 사유 조회 = 공방 상세 조회 재사용 (GET /partner/stores/{storeId}).
export function getStudioReviewStatus(storeId: string) {
    return clientApiFetch<PartnerStoreDetailResult>(`${BASE}/stores/${storeId}`, { method: 'GET' });
}
