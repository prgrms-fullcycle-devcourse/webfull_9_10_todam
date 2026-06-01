import { z } from 'zod';

import { OcrStatus } from '../enums/ocr-status';
import { StoreStatus } from '../enums/store-status';

import { convenienceInfoSchema, dayOfWeekSchema } from './store-registration';

// ─── 공방 상세 조회 (파트너센터) ──────────────────────────────────
// GET /api/v1/partner/stores/{storeId}
// API Contract 스냅샷(docs/exec-plans/active/공방-상세-조회.md) SSOT.
// BE/FE 공통 계약. 원본 API명세가 바뀌면 재plan → 이 파일 diff 로 추적.

export const storeDetailOperatingHourSchema = z.object({
    dayOfWeek: dayOfWeekSchema,
    openTime: z.string(),
    closeTime: z.string(),
    breakStart: z.string().nullable(),
    breakEnd: z.string().nullable(),
});
export type StoreDetailOperatingHour = z.infer<typeof storeDetailOperatingHourSchema>;

export const storeDetailImageSchema = z.object({
    id: z.string(),
    imageUrl: z.string(),
    thumbnailUrl: z.string(),
    isThumbnail: z.boolean(),
    sortOrder: z.number(),
});
export type StoreDetailImage = z.infer<typeof storeDetailImageSchema>;

export const storeDetailBusinessDocumentSchema = z.object({
    ownerName: z.string(),
    email: z.string(),
    businessName: z.string(),
    businessNumber: z.string(),
    businessAddress: z.string(),
    ocrStatus: z.nativeEnum(OcrStatus),
});
export type StoreDetailBusinessDocument = z.infer<typeof storeDetailBusinessDocumentSchema>;

export const storeDetailSchema = z.object({
    id: z.string(),
    partnerId: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    phone: z.string(),
    address: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    convenienceInfo: convenienceInfoSchema,
    autoConfirm: z.boolean(),
    cancelDeadlineDays: z.number(),
    status: z.nativeEnum(StoreStatus),
    rejectedReason: z.string().nullable(),
    // CONTRACT-5: 원문 오타 `suspededReason` → `suspendedReason` 수정 확정.
    suspendedReason: z.string().nullable(),
    // CONTRACT-1: UI 기본 정보 표시 필수. 리뷰 없으면 0.
    rating: z.number(),
    reviewCount: z.number(),
    // CONTRACT-1/3: 진행 중 예약 건수 = 체험 완료 처리되지 않은 예약 건. 없으면 0.
    inProgressReservationCount: z.number(),
    operatingHours: z.array(storeDetailOperatingHourSchema),
    images: z.array(storeDetailImageSchema),
    businessDocument: storeDetailBusinessDocumentSchema,
    publishedAt: z.string().nullable(),
    createdAt: z.string(),
});
export type StoreDetail = z.infer<typeof storeDetailSchema>;

// 상세 응답 봉투의 data 부분: { store }
export const storeDetailResultSchema = z.object({
    store: storeDetailSchema,
});
export type StoreDetailResult = z.infer<typeof storeDetailResultSchema>;

// ─── 에러 코드 (web mock·api 공통 계약) ──────────────────────────
export const StoreDetailErrorCode = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    STORE_NOT_FOUND: 'STORE_NOT_FOUND',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
export type StoreDetailErrorCode =
    (typeof StoreDetailErrorCode)[keyof typeof StoreDetailErrorCode];
