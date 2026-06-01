import { z } from 'zod';

import { OcrStatus } from '../enums/ocr-status';
import { StoreStatus } from '../enums/store-status';

import { phoneSchema, slugSchema } from './fields';
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
    // 스펙 표기 그대로 (오타 추정). contract 동결.
    suspededReason: z.string().nullable(),
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
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
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
