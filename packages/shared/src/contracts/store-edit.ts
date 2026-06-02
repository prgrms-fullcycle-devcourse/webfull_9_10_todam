import { z } from 'zod';

import { OcrStatus } from '../enums/ocr-status';
import { StoreStatus } from '../enums/store-status';

import { businessNumberSchema, emailSchema, phoneSchema, slugSchema } from './fields';
import { convenienceInfoSchema, operatingHourInputSchema } from './store-registration';

// ─── 에러 코드 (web mock·api 공통 계약) ──────────────────────────
// 공방 정보 수정 / 이미지 추가·삭제 공통 에러 코드.
export const StoreEditErrorCode = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    STORE_NOT_FOUND: 'STORE_NOT_FOUND',
    STORE_SLUG_DUPLICATED: 'STORE_SLUG_DUPLICATED',
    FILE_SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED',
    IMAGE_NOT_FOUND: 'IMAGE_NOT_FOUND',
    ALREADY_UPLOADED: 'ALREADY_UPLOADED',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type StoreEditErrorCode = (typeof StoreEditErrorCode)[keyof typeof StoreEditErrorCode];

// ─── 이미지 항목 (GET 응답) ──────────────────────────────────────
export const storeImageSchema = z.object({
    id: z.string(),
    imageUrl: z.string(),
    thumbnailUrl: z.string(),
    isThumbnail: z.boolean(),
    sortOrder: z.number(),
});
export type StoreImage = z.infer<typeof storeImageSchema>;

// ─── 사업자 서류 (수정 화면 비대상, 참조용) ──────────────────────
export const storeBusinessDocumentSchema = z.object({
    ownerName: z.string(),
    email: z.string(),
    businessName: z.string(),
    businessNumber: z.string(),
    businessAddress: z.string(),
    ocrStatus: z.nativeEnum(OcrStatus),
});
export type StoreBusinessDocument = z.infer<typeof storeBusinessDocumentSchema>;

// ─── 공방 상세 (GET /partner/stores/{storeId} 응답) ──────────────
export const partnerStoreDetailSchema = z.object({
    id: z.string(),
    partnerId: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    phone: z.string(),
    address: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    convenienceInfo: convenienceInfoSchema,
    autoConfirm: z.boolean(),
    cancelDeadlineDays: z.number(),
    // OD-1 확정 — 예약 정보 수정화면 preload 용 (BE 응답 보강)
    reservationIntervalMinutes: z.number(),
    maxCapacityPerSlot: z.number(),
    status: z.nativeEnum(StoreStatus),
    rejectedReason: z.string().nullable(),
    suspendedReason: z.string().nullable(),
    // 상세 조회 표시용 집계 (CONTRACT-1/3). 리뷰/진행예약 없으면 0.
    rating: z.number(),
    reviewCount: z.number(),
    // 진행 중 예약 = 체험 완료 처리되지 않은 예약 건수.
    inProgressReservationCount: z.number(),
    operatingHours: z.array(operatingHourInputSchema),
    images: z.array(storeImageSchema),
    businessDocument: storeBusinessDocumentSchema,
    publishedAt: z.string().nullable(),
    createdAt: z.string(),
});
export type PartnerStoreDetail = z.infer<typeof partnerStoreDetailSchema>;

export const partnerStoreDetailResultSchema = z.object({
    store: partnerStoreDetailSchema,
});
export type PartnerStoreDetailResult = z.infer<typeof partnerStoreDetailResultSchema>;

// ─── 공방 정보 수정 (PATCH /partner/stores/{storeId} body) ───────
// DEC-2: 변경된(dirty) 필드만 포함. operatingHours·images[]는 배열 전체 치환.
export const storeUpdateRequestSchema = z.object({
    name: z.string().min(2).max(40).optional(),
    slug: slugSchema.optional(),
    description: z.string().max(1000).nullable().optional(),
    phone: phoneSchema.optional(),
    // 주소(address/위경도) 변경은 partner-store-edit Out scope(geocode 재변환 별도) — PATCH 대상 아님.
    convenienceInfo: convenienceInfoSchema.optional(),
    autoConfirm: z.boolean().optional(),
    cancelDeadlineDays: z.number().int().min(0).optional(),
    reservationIntervalMinutes: z.number().int().positive().optional(),
    maxCapacityPerSlot: z.number().int().positive().optional(),
    operatingHours: z.array(operatingHourInputSchema).optional(),
    // OD-3: 최종 이미지 id 목록 (배열 전체 치환)
    images: z.array(z.string()).optional(),
});
export type StoreUpdateRequest = z.infer<typeof storeUpdateRequestSchema>;

export const storeUpdateResultSchema = z.object({
    store: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        status: z.nativeEnum(StoreStatus),
        updatedAt: z.string(),
    }),
});
export type StoreUpdateResult = z.infer<typeof storeUpdateResultSchema>;

// ─── 이미지 추가 (POST /partner/stores/{storeId}/images) ─────────
export const storeImageUploadRequestSchema = z.object({
    fileName: z.string(),
    fileType: z.string(),
    isThumbnail: z.boolean(),
});
export type StoreImageUploadRequest = z.infer<typeof storeImageUploadRequestSchema>;

export const storeImageUploadResultSchema = z.object({
    imageId: z.string(),
    uploadUrl: z.string(),
    imageUrl: z.string(),
});
export type StoreImageUploadResult = z.infer<typeof storeImageUploadResultSchema>;

// ─── 이미지 업로드 확정 (PATCH .../images/{imageId}/confirm) ─────
export const storeImageConfirmResultSchema = z.object({
    image: z.object({
        id: z.string(),
        status: z.string(),
    }),
});
export type StoreImageConfirmResult = z.infer<typeof storeImageConfirmResultSchema>;

// ─── 사업자 정보 수정 (PATCH /partner/stores/{storeId}/business-document) ─────
// 반려(REJECTED) 공방 재수정용. 변경 필드만 부분 갱신. 저장 시 재심사(REJECTED→PENDING) 전이.
export const businessDocumentUpdateRequestSchema = z.object({
    businessNumber: businessNumberSchema.optional(),
    businessName: z.string().min(1).optional(),
    ownerName: z.string().min(1).optional(),
    businessAddress: z.string().min(1).optional(),
    email: emailSchema.optional(),
    documentUrl: z.string().nullable().optional(),
});
export type BusinessDocumentUpdateRequest = z.infer<typeof businessDocumentUpdateRequestSchema>;

export const businessDocumentUpdateResultSchema = z.object({
    store: z.object({
        id: z.string(),
        status: z.nativeEnum(StoreStatus),
        updatedAt: z.string(),
    }),
});
export type BusinessDocumentUpdateResult = z.infer<typeof businessDocumentUpdateResultSchema>;
