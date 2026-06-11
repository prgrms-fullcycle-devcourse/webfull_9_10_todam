import { z } from 'zod';

import { PartnerStatus } from '../enums/partner-status';
import { StoreStatus } from '../enums/store-status';

import {
    businessNumberSchema,
    businessStartDateSchema,
    emailSchema,
    phoneSchema,
    slugSchema,
    timeSchema,
} from './fields';

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

// ─── 사업자등록증 OCR (POST /partner/business-documents/ocr) ─────
export const businessDocumentOcrRequestSchema = z.object({
    documentUrl: z.string().url().meta({
        example: 'https://cdn.todam.app/business-documents/{userId}/uuid.pdf',
        description: 'CDN URL (https://cdn.todam.app/business-documents/{userId}/...)',
    }),
});
export type BusinessDocumentOcrRequest = z.infer<typeof businessDocumentOcrRequestSchema>;

export const businessDocumentOcrResultSchema = z.object({
    businessNumber: z.string().nullable().meta({ example: '123-45-67890' }),
    ownerName: z.string().nullable().meta({ example: '홍길동' }),
    businessName: z.string().nullable().meta({ example: '흙담공방' }),
    businessAddress: z.string().nullable().meta({ example: '서울특별시 성동구 둑섬로 273' }),
    startDate: z
        .string()
        .nullable()
        .meta({ example: '20190315', description: '"YYYYMMDD" 또는 null' }),
});
export type BusinessDocumentOcrResult = z.infer<typeof businessDocumentOcrResultSchema>;

// ─── 공방 URL(slug) 중복 확인 ────────────────────────────────────
export const slugAvailabilityResultSchema = z.object({
    slug: z.string().meta({ example: 'my-workshop' }),
    available: z
        .boolean()
        .meta({ example: true, description: '다른 store가 점유하지 않으면 true' }),
});
export type SlugAvailabilityResult = z.infer<typeof slugAvailabilityResultSchema>;

// ─── 주소 → 좌표 ─────────────────────────────────────────────────
export const geocodeResultSchema = z.object({
    address: z.string().meta({ example: '서울특별시 성동구 성수이로 12길 34' }),
    latitude: z.number().meta({ example: 37.5446 }),
    longitude: z.number().meta({ example: 127.0556 }),
});
export type GeocodeResult = z.infer<typeof geocodeResultSchema>;

// ─── 영업시간 ────────────────────────────────────────────────────
export const operatingHourInputSchema = z.object({
    dayOfWeek: dayOfWeekSchema.meta({ example: 'MON', description: '요일' }),
    openTime: timeSchema.meta({ example: '10:00', description: '오픈 시각 (HH:mm)' }),
    closeTime: timeSchema.meta({ example: '19:00', description: '마감 시각 (HH:mm)' }),
    breakStart: timeSchema
        .meta({ example: '13:00', description: '브레이크 시작 (HH:mm)' })
        .nullable(),
    breakEnd: timeSchema
        .meta({ example: '14:00', description: '브레이크 종료 (HH:mm)' })
        .nullable(),
});
export type OperatingHourInput = z.infer<typeof operatingHourInputSchema>;

// ─── 편의 정보 ───────────────────────────────────────────────────
export const convenienceInfoSchema = z.object({
    parking: z.boolean().meta({ example: true, description: '주차 가능 여부' }),
    pet: z.boolean().meta({ example: false, description: '반려동물 동반 가능 여부' }),
    wifi: z.boolean().meta({ example: true, description: '와이파이 제공 여부' }),
});
export type ConvenienceInfo = z.infer<typeof convenienceInfoSchema>;

// ─── 공방 등록 제출 (백엔드 body 계약) ───────────────────────────
export const businessDocumentInputSchema = z.object({
    documentUrl: z.string().meta({
        example:
            'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/business-documents/uuid.pdf',
    }),
    ownerName: z.string().min(1).meta({ example: '김리듬' }),
    businessName: z.string().min(1).meta({ example: '흙담' }),
    businessNumber: businessNumberSchema.meta({ example: '555-55-55555' }),
    businessAddress: z.string().min(1).meta({ example: '서울특별시 성동구 둑섬로 273(성수동)' }),
    email: emailSchema.meta({ example: 'leadem@studio.com' }),
});

export const storeRegistrationSubmitRequestSchema = z.object({
    name: z.string().min(1).meta({ example: '토담 공방' }),
    slug: slugSchema.meta({ example: 'todam-studio' }),
    description: z.string().meta({ example: '흙과 함께하는 도자기 체험 공방입니다.' }),
    phone: phoneSchema.meta({ example: '02-1234-5678' }),
    address: z.string().min(1).meta({ example: '서울특별시 성동구 성수이로 12길 34' }),
    latitude: z.number().meta({ example: 37.5446 }),
    longitude: z.number().meta({ example: 127.0556 }),
    convenienceInfo: convenienceInfoSchema,
    images: z.array(z.string()).meta({ example: ['img-uuid-001', 'img-uuid-002'] }),
    autoConfirm: z.boolean().meta({ example: false }),
    // 예약 정보 (백엔드 body 확장 필드)
    reservationIntervalMinutes: z
        .number()
        .int()
        .positive()
        .meta({ example: 60, description: '타임슬롯 생성 기준 간격(분)' }),
    cancelDeadlineDays: z.number().int().min(0).meta({ example: 1 }),
    maxCapacityPerSlot: z
        .number()
        .int()
        .positive()
        .meta({ example: 6, description: '슬롯당 최대 예약 정원(공방 단위, 클래스 공통)' }),
    operatingHours: z.array(operatingHourInputSchema).min(1),
    businessDocument: businessDocumentInputSchema,
});
export type StoreRegistrationSubmitRequest = z.infer<typeof storeRegistrationSubmitRequestSchema>;

export const storeRegistrationSubmitResultSchema = z.object({
    partnerId: z.string().meta({ example: 'partner-uuid-001' }),
    storeId: z.string().meta({ example: 'store-uuid-001' }),
    partnerStatus: z.nativeEnum(PartnerStatus).meta({ example: PartnerStatus.PENDING }),
    storeStatus: z.nativeEnum(StoreStatus).meta({ example: StoreStatus.DRAFT }),
    slug: z.string().meta({ example: 'todam-studio' }),
});
export type StoreRegistrationSubmitResult = z.infer<typeof storeRegistrationSubmitResultSchema>;

// ─── 실 API 계약 (plan API Contract 스냅샷 바인딩) ───────────────
// 아래 4종은 apps/api 의 실제 엔드포인트 계약. (위 onboarding 계약은 MSW 단일-콜 mock 전용.)

// 1) POST /stores — 공방 초안 생성
export const createStoreBusinessDocumentSchema = z.object({
    // createStore wire format은 하이픈 없는 숫자 10자리(FE가 전송 시 하이픈 제거).
    // 하이픈 형식(000-00-00000)은 businessNumberSchema(수정 화면) 별도.
    businessNumber: z
        .string()
        .regex(/^\d{10}$/, '사업자등록번호는 하이픈 없이 숫자 10자리여야 합니다.')
        .meta({ example: '5555555555', description: '하이픈 없이 숫자 10자리' }),
    businessName: z.string().min(1).max(200).meta({ example: '흙담' }),
    ownerName: z.string().min(1).max(100).meta({ example: '김리듬' }),
    // 등록증상 사업장 주소(선택값). 미입력 시 빈 문자열. DB NOT NULL 이라 null 대신 '' 저장.
    businessAddress: z.string().max(500).meta({ example: '서울특별시 성동구 둑섬로 273(성수동)' }),
    email: emailSchema.max(255).meta({ example: 'leadem@studio.com' }).nullable().optional(),
    // 사업자등록증 파일 S3 URL. POST /partner/business-documents/images 발급 URL. 미첨부 시 null.
    documentUrl: z
        .string()
        .meta({
            example:
                'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/business-documents/uuid.pdf',
            description:
                '사업자등록증 파일 S3 URL. POST /partner/business-documents/images 발급 URL. 미첨부 시 null.',
        })
        .nullable()
        .optional(),
    // OCR prefill 또는 사용자 직접 입력. "YYYYMMDD" 8자리 실제 날짜. 미입력 시 null.
    startDate: businessStartDateSchema
        .meta({
            example: '20190315',
            description: 'OCR prefill 또는 사용자 직접 입력. YYYYMMDD 8자리.',
        })
        .nullable()
        .optional(),
});

export const createStoreRequestSchema = z.object({
    name: z
        .string()
        .min(2, '공방명은 2자 이상이어야 합니다.')
        .max(40, '공방명은 40자 이하여야 합니다.')
        .meta({ example: '토담 공방' }),
    slug: slugSchema
        .meta({
            example: 'todam-studio',
            description: '영문 소문자·숫자·하이픈, 4~40자. 미입력 시 자동 생성.',
        })
        .optional(),
    description: z
        .string()
        .max(1000, '공방 소개는 1000자 이하여야 합니다.')
        .meta({ example: '흙과 함께하는 도자기 체험 공방입니다.' })
        .nullable()
        .optional(),
    phone: phoneSchema.meta({ example: '02-1234-5678' }),
    address: z.string().min(1).meta({ example: '서울특별시 성동구 성수이로 12길 34' }),
    latitude: z.number().meta({ example: 37.5446 }),
    longitude: z.number().meta({ example: 127.0556 }),
    // 행정구역(좌표 → coord2RegionCode 역지오코딩). 지역명 자동완성 검색의 소스. 변환 실패 시 null.
    regionSido: z.string().nullable().optional().meta({ example: '서울' }),
    regionSigungu: z.string().nullable().optional().meta({ example: '성동구' }),
    regionDong: z.string().nullable().optional().meta({ example: '성수동' }),
    convenienceInfo: convenienceInfoSchema,
    autoConfirm: z.boolean().meta({ example: false }),
    cancelDeadlineDays: z.number().int().min(0).meta({ example: 1 }),
    reservationIntervalMinutes: z
        .union([z.literal(60), z.literal(90), z.literal(120), z.literal(180)], {
            error: '예약 시간 간격은 60, 90, 120, 180분 중 하나여야 합니다.',
        })
        .meta({
            description: '타임슬롯 생성 기준 간격(분). 1/1.5/2/3시간',
        }),
    // BE CreateStoreDto 필수. (contract 본문 예시엔 누락되어 있으나 DTO 기준 필수 — Decision Log 참조)
    maxCapacityPerSlot: z
        .number()
        .int()
        .positive()
        .meta({ example: 6, description: '슬롯당 최대 예약 정원(공방 단위, 클래스 공통)' }),
    operatingHours: z.array(operatingHourInputSchema).min(1),
    businessDocument: createStoreBusinessDocumentSchema,
});
export type CreateStoreRequest = z.infer<typeof createStoreRequestSchema>;

export const createStoreResultSchema = z.object({
    store: z.object({
        id: z.string().meta({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' }),
        partnerId: z.string().meta({ example: 'd5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a' }),
        name: z.string().meta({ example: '토담 공방' }),
        slug: z.string().meta({ example: 'todam-studio' }),
        status: z.nativeEnum(StoreStatus).meta({ example: StoreStatus.DRAFT }),
        createdAt: z.string().meta({ example: '2026-05-18T12:00:00.000Z' }),
    }),
});
export type CreateStoreResult = z.infer<typeof createStoreResultSchema>;

// 2) POST /partner/stores/{storeId}/images — presigned PUT URL 발급
export const createStoreImageRequestSchema = z.object({
    fileName: z.string().meta({ example: 'workshop_main.jpg' }),
    fileType: z.string().meta({ example: 'image/jpeg' }),
    isThumbnail: z.boolean().meta({ example: true }),
});
export type CreateStoreImageRequest = z.infer<typeof createStoreImageRequestSchema>;

export const createStoreImageResultSchema = z.object({
    imageId: z.string().meta({ example: 'img-uuid-001' }),
    uploadUrl: z.string().meta({ example: 'https://s3.ap-northeast-2.amazonaws.com/upload-url' }),
    imageUrl: z.string().meta({ example: 'https://cdn.todam.app/stores/todam-studio/01.jpg' }),
});
export type CreateStoreImageResult = z.infer<typeof createStoreImageResultSchema>;

// 2-1) POST /partner/business-documents/images — 사업자등록증 presigned PUT URL 발급 (store-비종속)
// 사업자등록증은 OCR(Vision TEXT_DETECTION) 대상이라 이미지(JPEG/PNG)만 허용.
// PDF는 Vision이 처리하지 못하므로 업로드 단계에서 차단(제출 후 OCR 415를 받기 전에 빠르게 실패).
export const BUSINESS_DOCUMENT_FILE_TYPES = ['image/jpeg', 'image/png'] as const;
export type BusinessDocumentFileType = (typeof BUSINESS_DOCUMENT_FILE_TYPES)[number];
// 업로드 전 클라이언트 측 사전 차단용 타입가드(File.type → 허용 enum 좁히기).
export function isBusinessDocumentFileType(t: string): t is BusinessDocumentFileType {
    return (BUSINESS_DOCUMENT_FILE_TYPES as readonly string[]).includes(t);
}
export const businessDocumentImageRequestSchema = z.object({
    fileName: z.string().meta({ example: 'business_license.jpg' }),
    fileType: z
        .enum(BUSINESS_DOCUMENT_FILE_TYPES)
        .meta({ example: 'image/jpeg', description: 'JPEG/PNG 이미지만 허용(PDF 불가)' }),
});
export type BusinessDocumentImageRequest = z.infer<typeof businessDocumentImageRequestSchema>;

export const businessDocumentImageResultSchema = z.object({
    uploadUrl: z.string().meta({ example: 'https://s3.ap-northeast-2.amazonaws.com/upload-url' }),
    documentUrl: z.string().meta({
        example:
            'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/business-documents/uuid.pdf',
    }),
});
export type BusinessDocumentImageResult = z.infer<typeof businessDocumentImageResultSchema>;

// 3) PATCH /partner/stores/{storeId}/images/{imageId}/confirm — 업로드 확인
export const confirmStoreImageResultSchema = z.object({
    image: z.object({
        id: z.string().meta({ example: 'img-uuid-001' }),
        status: z.string().meta({ example: 'UPLOADED' }),
    }),
});
export type ConfirmStoreImageResult = z.infer<typeof confirmStoreImageResultSchema>;

// 4) POST /partner/stores/{storeId}/submit — 심사 제출
export const submitStoreResultSchema = z.object({
    store: z.object({
        id: z.string().meta({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' }),
        status: z.nativeEnum(StoreStatus).meta({ example: StoreStatus.PENDING }),
        updatedAt: z.string().meta({ example: '2026-05-25T18:20:00.000Z' }),
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
    partnerId: z.string().meta({ example: 'partner-uuid-001' }),
    storeId: z.string().meta({ example: 'store-uuid-001' }),
    storeName: z.string().meta({ example: '토담 공방' }),
    slug: z.string().meta({ example: 'todam-studio' }),
    partnerStatus: z.nativeEnum(PartnerStatus).meta({ example: PartnerStatus.PENDING }),
    storeStatus: z.nativeEnum(StoreStatus).meta({ example: StoreStatus.PENDING }),
    rejectedReason: z.string().meta({ example: '사업자 정보 확인이 필요합니다.' }).nullable(),
    createdAt: z.string().meta({ example: '2026-05-18T12:00:00.000Z' }),
    address: z.string().meta({ example: '서울특별시 성동구 성수이로 12길 34' }),
    businessNumber: z.string().meta({ example: '555-55-55555' }),
    email: z.string().meta({ example: 'leadem@studio.com' }),
});
export type StoreRegistrationStatusResult = z.infer<typeof storeRegistrationStatusResultSchema>;

// ─── 온보딩 상태 조회 (GET /partner/onboarding — plan API Contract #5 스냅샷) ──
// 중첩 {partnerStatus, store{id,status,rejectedReason}}. 게이트 분기 키 = partnerStatus.
export const partnerOnboardingStoreSchema = z.object({
    id: z.string().meta({ example: 'store-uuid-001' }),
    status: z.nativeEnum(StoreStatus).meta({ example: StoreStatus.PENDING }),
    // store.status === REJECTED 일 때만 값, 그 외 null.
    rejectedReason: z.string().meta({ example: '사업자 정보 확인이 필요합니다.' }).nullable(),
});
export type PartnerOnboardingStore = z.infer<typeof partnerOnboardingStoreSchema>;

export const partnerOnboardingResultSchema = z.object({
    // partner 없으면 null.
    partnerStatus: z.nativeEnum(PartnerStatus).meta({ example: PartnerStatus.PENDING }).nullable(),
    // 최신 생성순 온보딩 store 1건. 없으면 null.
    store: partnerOnboardingStoreSchema.nullable(),
});
export type PartnerOnboardingResult = z.infer<typeof partnerOnboardingResultSchema>;
