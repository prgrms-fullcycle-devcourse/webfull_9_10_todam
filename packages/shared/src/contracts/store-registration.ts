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
