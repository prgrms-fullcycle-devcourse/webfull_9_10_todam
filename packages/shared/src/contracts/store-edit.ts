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
    id: z.string().meta({ example: 'img-uuid-001' }),
    imageUrl: z.string().meta({ example: 'https://cdn.todam.app/stores/todam-studio/01.jpg' }),
    isThumbnail: z.boolean().meta({ example: true }),
    sortOrder: z.number().meta({ example: 1 }),
});
export type StoreImage = z.infer<typeof storeImageSchema>;

// ─── 사업자 서류 (수정 화면 비대상, 참조용) ──────────────────────
export const storeBusinessDocumentSchema = z.object({
    ownerName: z.string().meta({ example: '김리듬' }),
    email: z.string().meta({ example: 'leadem@studio.com' }).nullable(),
    businessName: z.string().meta({ example: '흙담' }),
    businessNumber: z.string().meta({ example: '555-55-55555' }),
    businessAddress: z.string().meta({ example: '서울특별시 성동구 둑섬로 273(성수동)' }),
    ocrStatus: z.nativeEnum(OcrStatus).meta({ example: OcrStatus.VERIFIED }).nullable(),
});
export type StoreBusinessDocument = z.infer<typeof storeBusinessDocumentSchema>;

// ─── 공방 상세 (GET /partner/stores/{storeId} 응답) ──────────────
export const partnerStoreDetailSchema = z.object({
    id: z.string().meta({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' }),
    partnerId: z.string().meta({ example: 'd5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a' }),
    name: z.string().meta({ example: '토담 공방' }),
    slug: z.string().meta({ example: 'todam-studio' }),
    description: z.string().meta({ example: '흙과 함께하는 도자기 체험 공방입니다.' }).nullable(),
    phone: z.string().meta({ example: '02-1234-5678' }).nullable(),
    address: z.string().meta({ example: '서울특별시 성동구 성수이로 12길 34' }).nullable(),
    latitude: z.number().meta({ example: 37.5446 }).nullable(),
    longitude: z.number().meta({ example: 127.0556 }).nullable(),
    convenienceInfo: convenienceInfoSchema,
    autoConfirm: z.boolean().meta({ example: false }),
    cancelDeadlineDays: z.number().meta({ example: 1 }),
    // OD-1 확정 — 예약 정보 수정화면 preload 용 (BE 응답 보강)
    reservationIntervalMinutes: z.number().meta({
        example: 30,
        description: '예약 시간 간격(분). 예약 정보 수정화면 preload (OD-1)',
    }),
    maxCapacityPerSlot: z.number().meta({
        example: 6,
        description: '슬롯당 최대 수용 인원. 예약 정보 수정화면 preload (OD-1)',
    }),
    status: z.nativeEnum(StoreStatus).meta({ example: StoreStatus.PUBLISHED }),
    rejectedReason: z.string().meta({ example: null, description: '검수 반려 사유' }).nullable(),
    suspendedReason: z.string().meta({ example: null, description: '노출 중단 사유' }).nullable(),
    // 상세 조회 표시용 집계 (CONTRACT-1/3). 리뷰/진행예약 없으면 0.
    rating: z.number().meta({ example: 4.8, description: '공방 평균 별점. 리뷰 없으면 0' }),
    reviewCount: z.number().meta({ example: 132, description: '공방 리뷰 수. 리뷰 없으면 0' }),
    // 진행 중 예약 = 체험 완료 처리되지 않은 예약 건수.
    inProgressReservationCount: z.number().meta({
        example: 5,
        description: '진행 중 예약 건수 = 체험 완료 처리되지 않은 예약 건수. 없으면 0',
    }),
    operatingHours: z.array(operatingHourInputSchema),
    images: z.array(storeImageSchema),
    // 사업자 서류 미등록 공방은 null.
    businessDocument: storeBusinessDocumentSchema.nullable(),
    publishedAt: z.string().meta({ example: '2026-05-20T10:00:00.000Z' }).nullable(),
    createdAt: z.string().meta({ example: '2026-05-18T12:00:00.000Z' }),
});
export type PartnerStoreDetail = z.infer<typeof partnerStoreDetailSchema>;

export const partnerStoreDetailResultSchema = z.object({
    store: partnerStoreDetailSchema,
});
export type PartnerStoreDetailResult = z.infer<typeof partnerStoreDetailResultSchema>;

// ─── 공방 정보 수정 (PATCH /partner/stores/{storeId} body) ───────
// DEC-2: 변경된(dirty) 필드만 포함. operatingHours·images[]는 배열 전체 치환.
export const storeUpdateRequestSchema = z.object({
    name: z
        .string()
        .min(2, '공방명은 2자 이상이어야 합니다.')
        .max(40, '공방명은 40자 이하여야 합니다.')
        .meta({ example: '토담 도자기 공방' })
        .optional(),
    slug: slugSchema
        .meta({
            example: 'todam-pottery',
            description: '영문 소문자·숫자·하이픈, 4~40자. unique.',
        })
        .optional(),
    description: z
        .string()
        .max(1000, '공방 소개는 1000자 이하여야 합니다.')
        .meta({ example: '새롭게 단장한 토담 공방입니다.' })
        .nullable()
        .optional(),
    phone: phoneSchema.meta({ example: '02-9876-5432' }).optional(),
    // 주소(address/위경도) 변경은 partner-store-edit Out scope(geocode 재변환 별도) — PATCH 대상 아님.
    convenienceInfo: convenienceInfoSchema.optional(),
    autoConfirm: z.boolean().meta({ example: true }).optional(),
    cancelDeadlineDays: z.number().int().min(0).meta({ example: 1 }).optional(),
    reservationIntervalMinutes: z
        .union([z.literal(60), z.literal(90), z.literal(120), z.literal(180)])
        .meta({ description: '타임슬롯 생성 기준 간격(분). 1/1.5/2/3시간' })
        .optional(),
    maxCapacityPerSlot: z
        .number()
        .int()
        .positive()
        .meta({
            example: 6,
            description: '슬롯당 최대 예약 정원(공방 단위, 클래스 공통)',
        })
        .optional(),
    operatingHours: z
        .array(operatingHourInputSchema)
        .meta({ description: '운영시간 배열. 전달 시 전체 치환(DEC-4).' })
        .optional(),
    // OD-3: 최종 이미지 id 목록 (배열 전체 치환)
    images: z
        .array(z.string().uuid())
        .meta({ description: '최종 이미지 id 목록. 전달 시 전체 치환(OD-3).' })
        .optional(),
});
export type StoreUpdateRequest = z.infer<typeof storeUpdateRequestSchema>;

export const storeUpdateResultSchema = z.object({
    store: z.object({
        id: z.string().meta({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' }),
        name: z.string().meta({ example: '토담 공방' }),
        slug: z.string().meta({ example: 'todam-studio' }),
        status: z.nativeEnum(StoreStatus).meta({ example: StoreStatus.PUBLISHED }),
        updatedAt: z.string().meta({ example: '2026-05-25T18:20:00.000Z' }),
    }),
});
export type StoreUpdateResult = z.infer<typeof storeUpdateResultSchema>;

// ─── 이미지 추가 (POST /partner/stores/{storeId}/images) ─────────
export const storeImageUploadRequestSchema = z.object({
    fileName: z.string().meta({ example: 'workshop_main.jpg' }),
    fileType: z.string().meta({ example: 'image/jpeg' }),
    isThumbnail: z.boolean().meta({ example: true }),
});
export type StoreImageUploadRequest = z.infer<typeof storeImageUploadRequestSchema>;

export const storeImageUploadResultSchema = z.object({
    imageId: z.string().meta({ example: 'img-uuid-001' }),
    uploadUrl: z.string().meta({ example: 'https://s3.ap-northeast-2.amazonaws.com/upload-url' }),
    imageUrl: z.string().meta({ example: 'https://cdn.todam.app/stores/todam-studio/01.jpg' }),
});
export type StoreImageUploadResult = z.infer<typeof storeImageUploadResultSchema>;

// ─── 이미지 업로드 확정 (PATCH .../images/{imageId}/confirm) ─────
export const storeImageConfirmResultSchema = z.object({
    image: z.object({
        id: z.string().meta({ example: 'img-uuid-001' }),
        status: z.string().meta({ example: 'UPLOADED' }),
    }),
});
export type StoreImageConfirmResult = z.infer<typeof storeImageConfirmResultSchema>;

// ─── 사업자 정보 수정 (PATCH /partner/stores/{storeId}/business-document) ─────
// 반려(REJECTED) 공방 재수정용. 변경 필드만 부분 갱신. 저장 시 재심사(REJECTED→PENDING) 전이.
export const businessDocumentUpdateRequestSchema = z.object({
    businessNumber: businessNumberSchema
        .meta({
            example: '555-55-55555',
            description: '하이픈 포함 형식(000-00-00000)',
        })
        .optional(),
    businessName: z.string().min(1).max(200).meta({ example: '흙담' }).optional(),
    ownerName: z.string().min(1).max(100).meta({ example: '김리듬' }).optional(),
    businessAddress: z
        .string()
        .min(1)
        .max(500)
        .meta({ example: '서울특별시 성동구 둑섬로 273(성수동)' })
        .optional(),
    email: emailSchema.max(255).meta({ example: 'leadem@studio.com' }).optional(),
    documentUrl: z
        .string()
        .meta({
            example:
                'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/business-documents/uuid.pdf',
            description: '사업자등록증 파일 S3 URL. null 전달 시 파일 제거.',
        })
        .nullable()
        .optional(),
});
export type BusinessDocumentUpdateRequest = z.infer<typeof businessDocumentUpdateRequestSchema>;

export const businessDocumentUpdateResultSchema = z.object({
    store: z.object({
        id: z.string().meta({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' }),
        status: z.nativeEnum(StoreStatus).meta({ example: StoreStatus.PENDING }),
        updatedAt: z.string().meta({ example: '2026-05-25T18:20:00.000Z' }),
    }),
});
export type BusinessDocumentUpdateResult = z.infer<typeof businessDocumentUpdateResultSchema>;
