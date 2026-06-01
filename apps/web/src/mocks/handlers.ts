import {
    StoreEditErrorCode,
    StoreRegistrationErrorCode,
    storeRegistrationSubmitRequestSchema,
    storeUpdateRequestSchema,
    PartnerStatus,
    StoreStatus,
    type GeocodeResult,
    type PartnerStoreDetailResult,
    type StoreImageConfirmResult,
    type StoreImageUploadRequest,
    type StoreImageUploadResult,
    type StoreRegistrationStatusResult,
    type StoreRegistrationSubmitResult,
    type SlugAvailabilityResult,
    type StoreUpdateResult,
    type ToggleLikeRequest,
    type ToggleLikeResult,
    type PartnerStoreListResult,
} from '@todam/shared';
import { http, HttpResponse } from 'msw';

import {
    confirmPendingImage,
    createPendingImage,
    createStoreRegistration,
    deleteStoreImage,
    findLatestStoreRegistration,
    getStoreDetail,
    isBusinessNumberRegistered,
    isSlugTaken,
    isSlugTakenByOther,
    listPartnerStores,
    mockGeocode,
    nowIso,
    setLike,
    updateStoreDetail,
} from './db';

// 봉투 빌더 — apps/api 응답 형태와 일치.
function ok<T>(path: string, data: T, message = '요청이 처리되었습니다.', statusCode = 200) {
    return HttpResponse.json(
        { statusCode, timestamp: nowIso(), path, message, data, error: null },
        { status: statusCode },
    );
}
function fail(path: string, statusCode: number, code: string, message: string) {
    return HttpResponse.json(
        { statusCode, timestamp: nowIso(), path, message, data: null, error: code },
        { status: statusCode },
    );
}

const API = '*/api/v1';

export const handlers = [
    // 내 공방 목록 조회 (파트너센터) — 본인 소유 공방 전체, 최신 생성순
    http.get(`${API}/partner/stores`, () => {
        const path = '/api/v1/partner/stores';
        const result: PartnerStoreListResult = { stores: listPartnerStores() };
        return ok(path, result, '내 공방 목록이 성공적으로 조회되었습니다.');
    }),

    // 공방 URL(slug) 중복 확인
    http.get(`${API}/partner/stores/slug-availability`, ({ request }) => {
        const path = '/api/v1/partner/stores/slug-availability';
        const slug = new URL(request.url).searchParams.get('slug') ?? '';
        const result: SlugAvailabilityResult = { slug, available: !isSlugTaken(slug) };
        return ok(path, result);
    }),

    // 공방 이미지 추가 (presigned PUT URL 발급)
    http.post(`${API}/partner/stores/:storeId/images`, async ({ request, params }) => {
        const storeId = String(params.storeId);
        const path = `/api/v1/partner/stores/${storeId}/images`;
        const body = (await request.json()) as StoreImageUploadRequest;
        const result: StoreImageUploadResult = createPendingImage(
            storeId,
            body.fileName,
            !!body.isThumbnail,
        );
        return ok(
            path,
            result,
            'Pre-signed URL이 성공적으로 발급되었습니다. 5분 이내에 업로드를 완료해주세요.',
            201,
        );
    }),

    // 공방 이미지 업로드 확정 (PENDING → UPLOADED)
    http.patch(`${API}/partner/stores/:storeId/images/:imageId/confirm`, ({ params }) => {
        const storeId = String(params.storeId);
        const imageId = String(params.imageId);
        const path = `/api/v1/partner/stores/${storeId}/images/${imageId}/confirm`;
        const okConfirm = confirmPendingImage(imageId);
        if (!okConfirm) {
            return fail(
                path,
                404,
                StoreEditErrorCode.IMAGE_NOT_FOUND,
                '이미지를 찾을 수 없습니다.',
            );
        }
        const result: StoreImageConfirmResult = { image: { id: imageId, status: 'UPLOADED' } };
        return ok(path, result, '이미지 업로드가 확정되었습니다.');
    }),

    // 공방 이미지 삭제
    http.delete(`${API}/partner/stores/:storeId/images/:imageId`, ({ params }) => {
        const storeId = String(params.storeId);
        const imageId = String(params.imageId);
        const path = `/api/v1/partner/stores/${storeId}/images/${imageId}`;
        const removed = deleteStoreImage(storeId, imageId);
        if (!removed) {
            return fail(
                path,
                404,
                StoreEditErrorCode.IMAGE_NOT_FOUND,
                '이미지를 찾을 수 없습니다.',
            );
        }
        return ok(path, null, '이미지가 성공적으로 삭제되었습니다.');
    }),

    // 공방 정보 수정 (변경 필드만 부분 갱신, status 불변)
    http.patch(`${API}/partner/stores/:storeId`, async ({ request, params }) => {
        const storeId = String(params.storeId);
        const path = `/api/v1/partner/stores/${storeId}`;
        const raw = await request.json();
        const parsed = storeUpdateRequestSchema.safeParse(raw);
        if (!parsed.success) {
            return fail(
                path,
                400,
                StoreRegistrationErrorCode.VALIDATION_ERROR,
                parsed.error.issues[0]?.message ?? '잘못된 입력값입니다.',
            );
        }
        const body = parsed.data;
        if (body.slug !== undefined && isSlugTakenByOther(body.slug, storeId)) {
            return fail(
                path,
                409,
                StoreEditErrorCode.STORE_SLUG_DUPLICATED,
                '이미 사용 중인 공방 URL입니다.',
            );
        }
        const updated = updateStoreDetail(storeId, body);
        if (!updated) {
            return fail(path, 404, StoreEditErrorCode.STORE_NOT_FOUND, '공방을 찾을 수 없습니다.');
        }
        const result: StoreUpdateResult = {
            store: {
                id: updated.id,
                name: updated.name,
                slug: updated.slug,
                status: updated.status,
                updatedAt: nowIso(),
            },
        };
        return ok(path, result, '공방 정보가 성공적으로 수정되었습니다.');
    }),

    // 내 공방 상세 (수정 화면 preload)
    http.get(`${API}/partner/stores/:storeId`, ({ params }) => {
        const storeId = String(params.storeId);
        const path = `/api/v1/partner/stores/${storeId}`;
        const detail = getStoreDetail(storeId);
        if (!detail) {
            return fail(path, 404, StoreEditErrorCode.STORE_NOT_FOUND, '공방을 찾을 수 없습니다.');
        }
        const result: PartnerStoreDetailResult = { store: detail };
        return ok(path, result, '공방 상세 정보가 성공적으로 조회되었습니다.');
    }),

    // 주소 → 좌표 (주소 API 연동 mock)
    http.get(`${API}/geocode`, ({ request }) => {
        const path = '/api/v1/geocode';
        const query = new URL(request.url).searchParams.get('query') ?? '';
        if (!query) {
            return fail(
                path,
                400,
                StoreRegistrationErrorCode.VALIDATION_ERROR,
                '주소가 필요합니다.',
            );
        }
        const { latitude, longitude } = mockGeocode(query);
        const result: GeocodeResult = { address: query, latitude, longitude };
        return ok(path, result);
    }),

    // 공방 등록 제출 → Partner(PENDING)+Store(PENDING)+BusinessDocument+OperatingHours
    http.post(`${API}/partner/onboarding`, async ({ request }) => {
        const path = '/api/v1/partner/onboarding';
        const raw = await request.json();

        // zod 런타임 검증 (web mock·api 동일 스키마). 형식 오류 = VALIDATION_ERROR
        const parsed = storeRegistrationSubmitRequestSchema.safeParse(raw);
        if (!parsed.success) {
            return fail(
                path,
                400,
                StoreRegistrationErrorCode.VALIDATION_ERROR,
                parsed.error.issues[0]?.message ?? '필수 입력값이 누락되었습니다.',
            );
        }
        const body = parsed.data;
        const doc = body.businessDocument;

        if (isBusinessNumberRegistered(doc.businessNumber)) {
            return fail(
                path,
                409,
                StoreRegistrationErrorCode.BUSINESS_NUMBER_ALREADY_REGISTERED,
                '이미 다른 계정에 등록된 사업자번호입니다.',
            );
        }
        if (isSlugTaken(body.slug)) {
            return fail(
                path,
                409,
                StoreRegistrationErrorCode.STORE_SLUG_DUPLICATED,
                '이미 사용 중인 공방 URL입니다.',
            );
        }

        const { partner, store } = createStoreRegistration(body);
        const result: StoreRegistrationSubmitResult = {
            partnerId: partner.id,
            storeId: store.id,
            partnerStatus: PartnerStatus.PENDING,
            storeStatus: StoreStatus.PENDING,
            slug: store.slug,
        };
        return ok(path, result, '공방 등록 신청이 접수되었습니다.', 201);
    }),

    // 온보딩/검수 상태 조회 (완료 화면용)
    // ?preview=rejected → 반려 화면 미리보기 (어드민 검수 미구현 대체)
    http.get(`${API}/partner/onboarding`, ({ request }) => {
        const path = '/api/v1/partner/onboarding';
        const found = findLatestStoreRegistration();
        if (!found) {
            return fail(path, 404, 'ONBOARDING_NOT_FOUND', '신청 내역이 없습니다.');
        }
        const { partner, store, businessDoc } = found;
        const preview = new URL(request.url).searchParams.get('preview');
        const rejected = preview === 'rejected';
        const result: StoreRegistrationStatusResult = {
            partnerId: partner.id,
            storeId: store.id,
            storeName: store.name,
            slug: store.slug,
            partnerStatus: rejected ? PartnerStatus.REJECTED : partner.status,
            storeStatus: store.status,
            rejectedReason: rejected
                ? '사업자 등록증 이미지의 글씨가 흐려서 식별이 어렵습니다. 재업로드 부탁드립니다.'
                : (partner.rejectedReason ?? store.rejectedReason),
            createdAt: partner.createdAt,
            address: store.address,
            businessNumber: businessDoc?.businessNumber ?? '',
            email: businessDoc?.email ?? '',
        };
        return ok(path, result);
    }),

    // 찜 토글
    http.post(`${API}/stores/:storeId/like`, async ({ request, params }) => {
        const storeId = String(params.storeId);
        const path = `/api/v1/stores/${storeId}/like`;
        const body = (await request.json()) as ToggleLikeRequest;
        const liked = setLike(storeId, !!body?.liked);
        const result: ToggleLikeResult = { storeId, liked };
        return ok(path, result, liked ? '찜했습니다.' : '찜을 해제했습니다.');
    }),
];
