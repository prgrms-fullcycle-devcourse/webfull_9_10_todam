import { z } from 'zod';

import { StoreStatus } from '../enums/store-status';
import { VerificationStatus } from '../enums/verification-status';
import { BusinessState } from '../enums/business-state';
import { convenienceInfoSchema } from './store-registration';

// ─────────────────────────────────────────────────────────────────
// 어드민 contract SSOT
// plan: docs/exec-plans/active/admin.md — API Contract 스냅샷
// 요청 스키마는 .strict() — 미허용 필드 거부(BE forbidNonWhitelisted 대응).
// 응답 스키마는 응답 envelope(data) 내부 형태를 정의한다.
// ─────────────────────────────────────────────────────────────────

// ───────────── 로그인 (POST /admin/auth/login) ─────────────
export const adminLoginRequestSchema = z
    .object({
        email: z
            .string()
            .email('유효한 이메일을 입력해주세요.')
            .meta({ example: 'admin@todam.app' }),
        password: z
            .string()
            .min(1, '비밀번호를 입력해주세요.')
            .meta({ example: 'AdminPassword1!' }),
    })
    .strict();
export type AdminLoginRequest = z.infer<typeof adminLoginRequestSchema>;

export const adminInfoSchema = z.object({
    id: z.string().meta({ example: 'admin-uuid-001' }),
    email: z.string().meta({ example: 'admin@todam.app' }),
    name: z.string().meta({ example: '관리자' }),
});
export type AdminInfo = z.infer<typeof adminInfoSchema>;

export const adminLoginResponseSchema = z.object({
    admin: adminInfoSchema,
    accessToken: z.string().meta({ example: 'jwt-admin-access-token' }),
});
export type AdminLoginResponse = z.infer<typeof adminLoginResponseSchema>;

// ───────────── 공방 검수 목록 (GET /admin/stores) ─────────────
// 기본 status=PENDING. q 는 공방명·사업자명 부분검색. offset 페이지네이션.
export const adminStoreListQuerySchema = z.object({
    status: z.nativeEnum(StoreStatus).default(StoreStatus.PENDING),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    q: z.string().trim().min(1).optional(),
});
export type AdminStoreListQuery = z.infer<typeof adminStoreListQuerySchema>;

// 목록 행에 노출하는 파트너 요약.
export const adminStoreListPartnerSchema = z.object({
    partnerId: z.string().meta({ example: 'partner-uuid-101' }),
    nickname: z.string().meta({ example: '김파트너' }),
});
export type AdminStoreListPartner = z.infer<typeof adminStoreListPartnerSchema>;

// 목록 행에 노출하는 사업자 서류 요약.
export const adminStoreListBusinessDocumentSchema = z.object({
    documentId: z.string().meta({ example: 'doc-uuid-001' }),
    businessName: z.string().meta({ example: '토담 도예' }),
    businessNumber: z.string().meta({ example: '123-45-67890' }),
    ownerName: z.string().meta({ example: '김파트너' }),
    verificationStatus: z
        .nativeEnum(VerificationStatus)
        .meta({ example: VerificationStatus.VERIFIED }),
});
export type AdminStoreListBusinessDocument = z.infer<typeof adminStoreListBusinessDocumentSchema>;

export const adminStoreListItemSchema = z.object({
    storeId: z.string().meta({ example: 'store-uuid-001' }),
    name: z.string().meta({ example: '성수 토담 도예공방' }),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    regionSido: z.string().nullable().meta({ example: '서울' }),
    regionSigungu: z.string().nullable().meta({ example: '성동구' }),
    status: z.nativeEnum(StoreStatus),
    createdAt: z.string(),
    updatedAt: z.string(),
    partner: adminStoreListPartnerSchema,
    // 서류 미제출/미연동 공방 방어용 nullable.
    businessDocument: adminStoreListBusinessDocumentSchema.nullable(),
});
export type AdminStoreListItem = z.infer<typeof adminStoreListItemSchema>;

export const adminPaginationSchema = z.object({
    currentPage: z.number().int().min(1).meta({ example: 1 }),
    limit: z.number().int().min(1).meta({ example: 10 }),
    totalCount: z.number().int().min(0).meta({ example: 1 }),
    totalPages: z.number().int().min(0).meta({ example: 1 }),
});
export type AdminPagination = z.infer<typeof adminPaginationSchema>;

export const adminStoreListResponseSchema = z.object({
    stores: z.array(adminStoreListItemSchema),
    pagination: adminPaginationSchema,
});
export type AdminStoreListResponse = z.infer<typeof adminStoreListResponseSchema>;

// ───────────── 공방 검수 상세 (GET /admin/stores/:storeId) ─────────────
// Notion 미등록 → 기능명세 A-3 + 코드베이스(Store/StoreImage/BusinessDocument/Partner) 기반 설계.
export const adminStoreDetailImageSchema = z.object({
    imageUrl: z.string(),
    isThumbnail: z.boolean(),
});
export type AdminStoreDetailImage = z.infer<typeof adminStoreDetailImageSchema>;

export const adminStoreDetailStoreSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    address: z.string().nullable(),
    regionSido: z.string().nullable(),
    regionSigungu: z.string().nullable(),
    regionDong: z.string().nullable(),
    phone: z.string().nullable(),
    images: z.array(adminStoreDetailImageSchema),
    convenienceInfo: convenienceInfoSchema.nullable(),
    reservationIntervalMinutes: z.number().int().nullable(),
    maxCapacityPerSlot: z.number().int().nullable(),
    cancelDeadlineDays: z.number().int().nullable(),
    autoConfirm: z.boolean(),
    status: z.nativeEnum(StoreStatus),
    publishedAt: z.string().nullable(),
    rejectedReason: z.string().nullable(),
    suspendedReason: z.string().nullable(),
    createdAt: z.string(),
});
export type AdminStoreDetailStore = z.infer<typeof adminStoreDetailStoreSchema>;

export const adminStoreDetailBusinessDocumentSchema = z.object({
    id: z.string(),
    ownerName: z.string(),
    businessName: z.string(),
    businessNumber: z.string(),
    businessAddress: z.string(),
    startDate: z.string().nullable().meta({ example: '20190315', description: 'YYYYMMDD' }),
    documentUrl: z.string().nullable(),
    verificationStatus: z.nativeEnum(VerificationStatus),
    verifiedAt: z.string().nullable().meta({ description: '진위확인 통과 시각. null이면 미확인.' }),
    businessState: z.nativeEnum(BusinessState).nullable(),
});
export type AdminStoreDetailBusinessDocument = z.infer<
    typeof adminStoreDetailBusinessDocumentSchema
>;

export const adminStoreDetailPartnerSchema = z.object({
    id: z.string(),
    nickname: z.string(),
    email: z.string(),
});
export type AdminStoreDetailPartner = z.infer<typeof adminStoreDetailPartnerSchema>;

export const adminStoreDetailResponseSchema = z.object({
    store: adminStoreDetailStoreSchema,
    // 서류 미제출/미연동 공방 방어용 nullable.
    businessDocument: adminStoreDetailBusinessDocumentSchema.nullable(),
    partner: adminStoreDetailPartnerSchema,
});
export type AdminStoreDetailResponse = z.infer<typeof adminStoreDetailResponseSchema>;

// ───────────── 공방 상태 전이 액션 요청 ─────────────
// approve: PENDING → PUBLISHED (body 없음)
// reject:  PENDING → REJECTED (rejectedReason 필수)
// suspend: PUBLISHED → SUSPENDED (suspendedReason 필수)
// restore: SUSPENDED → PUBLISHED (body 없음)
export const adminStoreRejectRequestSchema = z
    .object({
        rejectedReason: z
            .string()
            .trim()
            .min(1, '반려 사유를 입력해주세요.')
            .meta({ example: '사업자등록증 이미지가 불명확합니다.' }),
    })
    .strict();
export type AdminStoreRejectRequest = z.infer<typeof adminStoreRejectRequestSchema>;

export const adminStoreSuspendRequestSchema = z
    .object({
        suspendedReason: z
            .string()
            .trim()
            .min(1, '노출 중단 사유를 입력해주세요.')
            .meta({ example: '허위 정보 게재로 인한 노출 중단 조치입니다.' }),
    })
    .strict();
export type AdminStoreSuspendRequest = z.infer<typeof adminStoreSuspendRequestSchema>;

// 상태 전이 액션(approve/reject/suspend/restore) 공통 응답.
// 전이 결과 Store 핵심 필드만 반환. 미해당 사유 필드는 null.
export const adminStoreActionResponseSchema = z.object({
    store: z.object({
        id: z.string(),
        status: z.nativeEnum(StoreStatus),
        publishedAt: z.string().nullable(),
        rejectedReason: z.string().nullable(),
        suspendedReason: z.string().nullable(),
        updatedAt: z.string(),
    }),
});
export type AdminStoreActionResponse = z.infer<typeof adminStoreActionResponseSchema>;
