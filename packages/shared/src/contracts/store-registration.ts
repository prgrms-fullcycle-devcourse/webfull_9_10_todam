import { z } from 'zod';

import { OcrStatus } from '../enums/ocr-status';
import { PartnerStatus } from '../enums/partner-status';
import { StoreStatus } from '../enums/store-status';

import { businessNumberSchema, emailSchema, phoneSchema, slugSchema, timeSchema } from './fields';

// ─── 에러 코드 (web mock·api 공통 계약) ──────────────────────────
export const StoreRegistrationErrorCode = {
    BUSINESS_NUMBER_INVALID_FORMAT: 'BUSINESS_NUMBER_INVALID_FORMAT',
    BUSINESS_NUMBER_ALREADY_REGISTERED: 'BUSINESS_NUMBER_ALREADY_REGISTERED',
    STORE_SLUG_DUPLICATED: 'STORE_SLUG_DUPLICATED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;
export type StoreRegistrationErrorCode =
    (typeof StoreRegistrationErrorCode)[keyof typeof StoreRegistrationErrorCode];

// ─── 공통 형식 ───────────────────────────────────────────────────
// 영업 요일. 배열 index 0=일 ~ 6=토 매핑.
export const DAY_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
export const dayOfWeekSchema = z.enum(DAY_OF_WEEK);
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;

// ─── OCR / 진위검증 (추후 연동) ──────────────────────────────────
export const ocrResultSchema = z.object({
    documentUrl: z.string(),
    ownerName: z.string(),
    businessName: z.string(),
    businessNumber: z.string(),
    businessAddress: z.string(),
    ocrStatus: z.nativeEnum(OcrStatus),
});
export type OcrResult = z.infer<typeof ocrResultSchema>;

// ─── 공방 URL(slug) 중복 확인 ────────────────────────────────────
export const slugAvailabilityResultSchema = z.object({
    slug: z.string(),
    available: z.boolean(),
});
export type SlugAvailabilityResult = z.infer<typeof slugAvailabilityResultSchema>;

// ─── 주소 → 좌표 ─────────────────────────────────────────────────
export const geocodeResultSchema = z.object({
    address: z.string(),
    latitude: z.number(),
    longitude: z.number(),
});
export type GeocodeResult = z.infer<typeof geocodeResultSchema>;

// ─── 영업시간 ────────────────────────────────────────────────────
export const operatingHourInputSchema = z.object({
    dayOfWeek: dayOfWeekSchema,
    openTime: timeSchema,
    closeTime: timeSchema,
    breakStart: timeSchema.nullable(),
    breakEnd: timeSchema.nullable(),
});
export type OperatingHourInput = z.infer<typeof operatingHourInputSchema>;

// ─── 편의 정보 ───────────────────────────────────────────────────
export const convenienceInfoSchema = z.object({
    parking: z.boolean(),
    pet: z.boolean(),
    wifi: z.boolean(),
});
export type ConvenienceInfo = z.infer<typeof convenienceInfoSchema>;

// ─── 공방 등록 제출 (백엔드 body 계약) ───────────────────────────
export const businessDocumentInputSchema = z.object({
    documentUrl: z.string(),
    ownerName: z.string().min(1),
    businessName: z.string().min(1),
    businessNumber: businessNumberSchema,
    businessAddress: z.string().min(1),
    email: emailSchema,
});

export const storeRegistrationSubmitRequestSchema = z.object({
    name: z.string().min(1),
    slug: slugSchema,
    description: z.string(),
    phone: phoneSchema,
    address: z.string().min(1),
    latitude: z.number(),
    longitude: z.number(),
    convenienceInfo: convenienceInfoSchema,
    images: z.array(z.string()),
    autoConfirm: z.boolean(),
    // 예약 정보 (백엔드 body 확장 필드)
    reservationIntervalMinutes: z.number().int().positive(),
    cancelDeadlineDays: z.number().int().min(0),
    maxCapacityPerSlot: z.number().int().positive(),
    operatingHours: z.array(operatingHourInputSchema).min(1),
    businessDocument: businessDocumentInputSchema,
});
export type StoreRegistrationSubmitRequest = z.infer<typeof storeRegistrationSubmitRequestSchema>;

export const storeRegistrationSubmitResultSchema = z.object({
    partnerId: z.string(),
    storeId: z.string(),
    partnerStatus: z.nativeEnum(PartnerStatus),
    storeStatus: z.nativeEnum(StoreStatus),
    slug: z.string(),
});
export type StoreRegistrationSubmitResult = z.infer<typeof storeRegistrationSubmitResultSchema>;

// ─── 실 API 계약 (plan API Contract 스냅샷 바인딩) ───────────────
// 아래 4종은 apps/api 의 실제 엔드포인트 계약. (위 onboarding 계약은 MSW 단일-콜 mock 전용.)

// 1) POST /stores — 공방 초안 생성
export const createStoreBusinessDocumentSchema = z.object({
    businessNumber: businessNumberSchema,
    businessName: z.string().min(1).max(200),
    ownerName: z.string().min(1).max(100),
    businessAddress: z.string().min(1).max(500),
    email: emailSchema.nullable().optional(),
    // 사업자등록증 파일 S3 URL. POST /partner/business-documents/images 발급 URL. 미첨부 시 null.
    documentUrl: z.string().nullable().optional(),
});

export const createStoreRequestSchema = z.object({
    name: z.string().min(2).max(40),
    slug: slugSchema.optional(),
    description: z.string().max(1000).nullable().optional(),
    phone: phoneSchema,
    address: z.string().min(1),
    latitude: z.number(),
    longitude: z.number(),
    convenienceInfo: convenienceInfoSchema,
    autoConfirm: z.boolean(),
    cancelDeadlineDays: z.number().int().min(0),
    reservationIntervalMinutes: z.union([
        z.literal(60),
        z.literal(90),
        z.literal(120),
        z.literal(180),
    ]),
    // BE CreateStoreDto 필수. (contract 본문 예시엔 누락되어 있으나 DTO 기준 필수 — Decision Log 참조)
    maxCapacityPerSlot: z.number().int().positive(),
    operatingHours: z.array(operatingHourInputSchema).min(1),
    businessDocument: createStoreBusinessDocumentSchema,
});
export type CreateStoreRequest = z.infer<typeof createStoreRequestSchema>;

export const createStoreResultSchema = z.object({
    store: z.object({
        id: z.string(),
        partnerId: z.string(),
        name: z.string(),
        slug: z.string(),
        status: z.nativeEnum(StoreStatus),
        createdAt: z.string(),
    }),
});
export type CreateStoreResult = z.infer<typeof createStoreResultSchema>;

// 2) POST /partner/stores/{storeId}/images — presigned PUT URL 발급
export const createStoreImageRequestSchema = z.object({
    fileName: z.string(),
    fileType: z.string(),
    isThumbnail: z.boolean(),
});
export type CreateStoreImageRequest = z.infer<typeof createStoreImageRequestSchema>;

export const createStoreImageResultSchema = z.object({
    imageId: z.string(),
    uploadUrl: z.string(),
    imageUrl: z.string(),
});
export type CreateStoreImageResult = z.infer<typeof createStoreImageResultSchema>;

// 2-1) POST /partner/business-documents/images — 사업자등록증 presigned PUT URL 발급 (store-비종속)
export const businessDocumentImageRequestSchema = z.object({
    fileName: z.string(),
    fileType: z.string(),
});
export type BusinessDocumentImageRequest = z.infer<typeof businessDocumentImageRequestSchema>;

export const businessDocumentImageResultSchema = z.object({
    uploadUrl: z.string(),
    documentUrl: z.string(),
});
export type BusinessDocumentImageResult = z.infer<typeof businessDocumentImageResultSchema>;

// 3) PATCH /partner/stores/{storeId}/images/{imageId}/confirm — 업로드 확인
export const confirmStoreImageResultSchema = z.object({
    image: z.object({
        id: z.string(),
        status: z.string(),
    }),
});
export type ConfirmStoreImageResult = z.infer<typeof confirmStoreImageResultSchema>;

// 4) POST /partner/stores/{storeId}/submit — 심사 제출
export const submitStoreResultSchema = z.object({
    store: z.object({
        id: z.string(),
        status: z.nativeEnum(StoreStatus),
        updatedAt: z.string(),
    }),
});
export type SubmitStoreResult = z.infer<typeof submitStoreResultSchema>;

// 실 API 에러 코드 (plan 스냅샷). 위 StoreRegistrationErrorCode(=mock 계약)와 별개.
export const StoreRegistrationApiErrorCode = {
    BAD_REQUEST: 'BAD_REQUEST',
    UNAUTHORIZED: 'UNAUTHORIZED',
    PARTNER_NOT_APPROVED: 'PARTNER_NOT_APPROVED',
    SLUG_CONFLICT: 'SLUG_CONFLICT',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_UPLOADED: 'ALREADY_UPLOADED',
    MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
    INVALID_STORE_STATUS: 'INVALID_STORE_STATUS',
    FILE_SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type StoreRegistrationApiErrorCode =
    (typeof StoreRegistrationApiErrorCode)[keyof typeof StoreRegistrationApiErrorCode];

// ─── 온보딩/검수 상태 조회 ───────────────────────────────────────
export const storeRegistrationStatusResultSchema = z.object({
    partnerId: z.string(),
    storeId: z.string(),
    storeName: z.string(),
    slug: z.string(),
    partnerStatus: z.nativeEnum(PartnerStatus),
    storeStatus: z.nativeEnum(StoreStatus),
    rejectedReason: z.string().nullable(),
    createdAt: z.string(),
    address: z.string(),
    businessNumber: z.string(),
    email: z.string(),
});
export type StoreRegistrationStatusResult = z.infer<typeof storeRegistrationStatusResultSchema>;

// ─── 온보딩 상태 조회 (GET /partner/onboarding — plan API Contract #5 스냅샷) ──
// 중첩 {partnerStatus, store{id,status,rejectedReason}}. 게이트 분기 키 = partnerStatus.
export const partnerOnboardingStoreSchema = z.object({
    id: z.string(),
    status: z.nativeEnum(StoreStatus),
    // store.status === REJECTED 일 때만 값, 그 외 null.
    rejectedReason: z.string().nullable(),
});
export type PartnerOnboardingStore = z.infer<typeof partnerOnboardingStoreSchema>;

export const partnerOnboardingResultSchema = z.object({
    // partner 없으면 null.
    partnerStatus: z.nativeEnum(PartnerStatus).nullable(),
    // 최신 생성순 온보딩 store 1건. 없으면 null.
    store: partnerOnboardingStoreSchema.nullable(),
});
export type PartnerOnboardingResult = z.infer<typeof partnerOnboardingResultSchema>;
