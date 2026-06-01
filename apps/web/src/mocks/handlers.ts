import {
    RESERVATION_LIST_DEFAULT_LIMIT,
    ReservationStatus,
    StoreDetailErrorCode,
    StoreRegistrationErrorCode,
    storeRegistrationSubmitRequestSchema,
    PartnerStatus,
    StoreStatus,
    type GeocodeResult,
    type PartnerProgramListResult,
    type ReservationListResult,
    type StoreDetailResult,
    type StoreRegistrationStatusResult,
    type StoreRegistrationSubmitResult,
    type SlugAvailabilityResult,
    type ToggleLikeRequest,
    type ToggleLikeResult,
    type PartnerStoreListResult,
} from '@todam/shared';
import { http, HttpResponse } from 'msw';

import {
    createStoreRegistration,
    findLatestStoreRegistration,
    findPartnerStoreDetail,
    findPartnerStorePrograms,
    isBusinessNumberRegistered,
    isSlugTaken,
    listMyReservations,
    listPartnerStores,
    mockGeocode,
    nowIso,
    setLike,
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

    // 공방 운영 클래스 목록 (파트너센터) — status enum 전체, 0개 시 []
    http.get(`${API}/partner/stores/:storeId/programs`, ({ params }) => {
        const storeId = String(params.storeId);
        const path = `/api/v1/partner/stores/${storeId}/programs`;
        const programs = findPartnerStorePrograms(storeId);
        if (programs === null) {
            return fail(
                path,
                404,
                StoreDetailErrorCode.STORE_NOT_FOUND,
                '공방을 찾을 수 없습니다.',
            );
        }
        const result: PartnerProgramListResult = { programs };
        return ok(path, result, '운영 클래스 목록이 성공적으로 조회되었습니다.');
    }),

    // 내 공방 상세 조회 (파트너센터)
    http.get(`${API}/partner/stores/:storeId`, ({ params }) => {
        const storeId = String(params.storeId);
        const path = `/api/v1/partner/stores/${storeId}`;
        const store = findPartnerStoreDetail(storeId);
        if (!store) {
            return fail(
                path,
                404,
                StoreDetailErrorCode.STORE_NOT_FOUND,
                '공방을 찾을 수 없습니다.',
            );
        }
        const result: StoreDetailResult = { store };
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

    // 나의 예약 목록 조회 (인증 필요, 본인 예약만, 커서 페이지네이션)
    // plan: docs/exec-plans/active/user-예약-나의 예약조회.md API Contract (스냅샷) 기준.
    // 시뮬: 헤더에 Authorization 없으면 401. ?empty=1 이면 빈 결과. ?simulate=500 이면 서버오류.
    http.get(`${API}/reservations/me`, ({ request }) => {
        const path = '/api/v1/reservations/me';
        const url = new URL(request.url);

        // mock 401 시뮬레이션: NEXT_PUBLIC_API_URL 미사용 환경에선 토큰 없이도 동작해야
        // 화면 개발이 가능하므로, "?unauth=1" 명시 시에만 401 응답.
        if (url.searchParams.get('unauth') === '1') {
            return fail(path, 401, 'UNAUTHORIZED', '인증이 필요합니다.');
        }
        if (url.searchParams.get('simulate') === '500') {
            return fail(
                path,
                500,
                'INTERNAL_SERVER_ERROR',
                '예약 목록 조회 중 서버 오류가 발생했습니다.',
            );
        }

        // ?empty=1 → 빈 결과
        if (url.searchParams.get('empty') === '1') {
            const result: ReservationListResult = {
                reservations: [],
                nextCursor: null,
                hasMore: false,
            };
            return ok(path, result, '예약 목록이 성공적으로 조회되었습니다.');
        }

        const statusParam = url.searchParams.get('status') as ReservationStatus | null;
        const cursor = url.searchParams.get('cursor');
        const limitParam = Number(url.searchParams.get('limit'));
        const limit =
            Number.isFinite(limitParam) && limitParam > 0
                ? limitParam
                : RESERVATION_LIST_DEFAULT_LIMIT;

        // 1) 본인 예약 + status 필터 적용
        let all = listMyReservations();
        if (statusParam) {
            all = all.filter((r) => r.status === statusParam);
        }

        // 2) cursor 적용: cursor 가 가리키는 id 이후부터(최신순 정렬 기준 그 다음)
        let startIdx = 0;
        if (cursor) {
            const idx = all.findIndex((r) => r.id === cursor);
            startIdx = idx >= 0 ? idx + 1 : all.length; // cursor 가 없으면 결과 비움
        }

        // 3) limit+1 방식으로 hasMore 판정 (plan §커서 페이지네이션 방식)
        const window = all.slice(startIdx, startIdx + limit + 1);
        const hasMore = window.length > limit;
        const reservations = window.slice(0, limit);
        const nextCursor = hasMore ? (reservations[reservations.length - 1]?.id ?? null) : null;

        const result: ReservationListResult = { reservations, nextCursor, hasMore };
        return ok(path, result, '예약 목록이 성공적으로 조회되었습니다.');
    }),
];
