import {
    StoreEditErrorCode,
    RESERVATION_LIST_DEFAULT_LIMIT,
    ReservationStatus,
    StoreRegistrationErrorCode,
    storeRegistrationSubmitRequestSchema,
    storeUpdateRequestSchema,
    PartnerStatus,
    StoreStatus,
    ProgramEditErrorCode,
    type ArtworkDetailResult,
    type GeocodeResult,
    type PartnerProgramListResult,
    type PartnerStoreDetailResult,
    type StoreImageConfirmResult,
    type StoreImageUploadRequest,
    type StoreImageUploadResult,
    type ReservationDetailResult,
    type ReservationListResult,
    type ReviewDetailResult,
    type StoreRegistrationStatusResult,
    type StoreRegistrationSubmitResult,
    type SlugAvailabilityResult,
    type StoreUpdateResult,
    type ToggleLikeRequest,
    type ToggleLikeResult,
    type PartnerStoreListResult,
    type ProgramDetailResult,
    type ProgramEditResult,
    type ProgramImageUploadResult,
} from '@todam/shared';
import { http, HttpResponse } from 'msw';

import {
    confirmPendingImage,
    createPendingImage,
    createStoreRegistration,
    deleteStoreImage,
    findArtworkDetail,
    findLatestStoreRegistration,
    findProgramBySlugAndId,
    findProgramByStoreAndId,
    addProgramImage,
    removeProgramImage,
    updateProgram,
    programToApiShape,
    genId,
    findPartnerStorePrograms,
    findReservationDetail,
    findReviewByReservation,
    getStoreDetail,
    isBusinessNumberRegistered,
    isSlugTaken,
    isSlugTakenByOther,
    listMyReservations,
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

    // 공방 운영 클래스 목록 (파트너센터) — status enum 전체, 0개 시 []
    http.get(`${API}/partner/stores/:storeId/programs`, ({ params }) => {
        const storeId = String(params.storeId);
        const path = `/api/v1/partner/stores/${storeId}/programs`;
        const programs = findPartnerStorePrograms(storeId);
        if (programs === null) {
            return fail(path, 404, StoreEditErrorCode.STORE_NOT_FOUND, '공방을 찾을 수 없습니다.');
        }
        const result: PartnerProgramListResult = { programs };
        return ok(path, result, '운영 클래스 목록이 성공적으로 조회되었습니다.');
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

    // ─── 프로그램 상세 조회 (퍼블릭, preload용) ─────────────────────────
    // GET /stores/{slug}/programs/{programId}
    http.get(`${API}/stores/:slug/programs/:programId`, ({ params }) => {
        const slug = String(params.slug);
        const programId = String(params.programId);
        const path = `/api/v1/stores/${slug}/programs/${programId}`;

        const program = findProgramBySlugAndId(slug, programId);
        if (!program) {
            return fail(
                path,
                404,
                ProgramEditErrorCode.PROGRAM_NOT_FOUND,
                '프로그램을 찾을 수 없습니다.',
            );
        }

        const result: ProgramDetailResult = {
            program: programToApiShape(program) as ProgramDetailResult['program'],
        };
        return ok(path, result, '프로그램 상세가 조회되었습니다.');
    }),

    // ─── 프로그램 수정 ────────────────────────────────────────────────
    // PATCH /partner/stores/{storeId}/programs/{programId}
    http.patch(
        `${API}/partner/stores/:storeId/programs/:programId`,
        async ({ request, params }) => {
            const storeId = String(params.storeId);
            const programId = String(params.programId);
            const path = `/api/v1/partner/stores/${storeId}/programs/${programId}`;

            const program = findProgramByStoreAndId(storeId, programId);
            if (!program) {
                return fail(
                    path,
                    404,
                    ProgramEditErrorCode.PROGRAM_NOT_FOUND,
                    '프로그램을 찾을 수 없습니다.',
                );
            }

            const body = (await request.json()) as Record<string, unknown>;
            const updated = updateProgram(programId, body as Parameters<typeof updateProgram>[1]);
            if (!updated) {
                return fail(
                    path,
                    500,
                    ProgramEditErrorCode.INTERNAL_SERVER_ERROR,
                    '수정에 실패했습니다.',
                );
            }

            const result: ProgramEditResult = {
                program: {
                    id: updated.id,
                    title: updated.title,
                    price: updated.price,
                    status: updated.status,
                    updatedAt: updated.updatedAt,
                },
            };
            return ok(path, result, '프로그램이 성공적으로 수정되었습니다.');
        },
    ),

    // ─── 이미지 Pre-signed URL 발급 ──────────────────────────────────
    // POST /partner/stores/{storeId}/programs/{programId}/images
    http.post(
        `${API}/partner/stores/:storeId/programs/:programId/images`,
        async ({ request, params }) => {
            const storeId = String(params.storeId);
            const programId = String(params.programId);
            const path = `/api/v1/partner/stores/${storeId}/programs/${programId}/images`;

            const body = (await request.json()) as {
                fileName: string;
                fileType: string;
                isThumbnail: boolean;
            };

            const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic'];
            if (!ALLOWED_TYPES.includes(body.fileType)) {
                return fail(
                    path,
                    400,
                    ProgramEditErrorCode.INVALID_FILE_TYPE,
                    '지원하지 않는 파일 형식입니다.',
                );
            }

            const programImageId = genId('prog-img');
            const imageUrl = `https://cdn.todam.app/programs/${programId}/${programImageId}.png`;
            // mock: uploadUrl 은 자체 엔드포인트로 대체 (실제 S3 URL 흉내)
            const uploadUrl = `https://todam-bucket.s3.ap-northeast-2.amazonaws.com/programs/${programId}/${programImageId}.png?mock=1`;

            addProgramImage(programId, {
                programImageId,
                imageUrl,
                thumbnailUrl: imageUrl,
                isThumbnail: body.isThumbnail,
            });

            const result: ProgramImageUploadResult = { programImageId, uploadUrl, imageUrl };
            return ok(path, result, '프로그램 이미지 업로드용 URL이 발급되었습니다.', 201);
        },
    ),

    // ─── 이미지 삭제 ────────────────────────────────────────────────
    // DELETE /partner/stores/{storeId}/programs/{programId}/images/{imageId}
    http.delete(
        `${API}/partner/stores/:storeId/programs/:programId/images/:imageId`,
        ({ params }) => {
            const storeId = String(params.storeId);
            const programId = String(params.programId);
            const imageId = String(params.imageId);
            const path = `/api/v1/partner/stores/${storeId}/programs/${programId}/images/${imageId}`;

            const deleted = removeProgramImage(imageId);
            if (!deleted) {
                return fail(
                    path,
                    404,
                    ProgramEditErrorCode.IMAGE_NOT_FOUND,
                    '이미지를 찾을 수 없습니다.',
                );
            }

            return ok(path, null, '프로그램 이미지가 삭제되었습니다.');
        },
    ),

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

    // 예약 상세 조회 (인증 필요, 본인 예약만)
    // plan: docs/exec-plans/active/유저 예약 - 예약 상세조회.md API Contract (스냅샷) 기준.
    // 시뮬 토글(직접 fetch 시에만 동작 — staleTime + URL forwarding 미적용 환경 한정):
    //   ?unauth=1 → 401 UNAUTHORIZED
    //   ?simulate=403 → 403 FORBIDDEN (타인 예약 가정)
    //   ?simulate=404 → 404 RESERVATION_NOT_FOUND
    //   ?simulate=500 → 500 INTERNAL_SERVER_ERROR
    http.get(`${API}/reservations/:reservationId`, ({ params, request }) => {
        const reservationId = String(params.reservationId);
        const path = `/api/v1/reservations/${reservationId}`;
        const url = new URL(request.url);

        if (url.searchParams.get('unauth') === '1') {
            return fail(path, 401, 'UNAUTHORIZED', '인증이 필요합니다.');
        }
        const simulate = url.searchParams.get('simulate');
        if (simulate === '500') {
            return fail(
                path,
                500,
                'INTERNAL_SERVER_ERROR',
                '예약 상세 조회 중 서버 오류가 발생했습니다.',
            );
        }
        if (simulate === '403') {
            return fail(path, 403, 'FORBIDDEN', '해당 예약에 대한 접근 권한이 없습니다.');
        }
        if (simulate === '404') {
            return fail(path, 404, 'RESERVATION_NOT_FOUND', '예약을 찾을 수 없습니다.');
        }

        const reservation = findReservationDetail(reservationId);
        if (!reservation) {
            return fail(path, 404, 'RESERVATION_NOT_FOUND', '예약을 찾을 수 없습니다.');
        }

        const result: ReservationDetailResult = { reservation };
        return ok(path, result, '예약 상세 정보가 성공적으로 조회되었습니다.');
    }),

    // 예약별 리뷰 상세 조회 (D4 가정 endpoint — BE 채택 패턴 결정 대기).
    // hasReview=true 인 예약만 200, 외엔 404 REVIEW_NOT_FOUND.
    http.get(`${API}/reservations/:reservationId/review`, ({ params, request }) => {
        const reservationId = String(params.reservationId);
        const path = `/api/v1/reservations/${reservationId}/review`;
        const url = new URL(request.url);

        if (url.searchParams.get('unauth') === '1') {
            return fail(path, 401, 'UNAUTHORIZED', '인증이 필요합니다.');
        }

        const review = findReviewByReservation(reservationId);
        if (!review) {
            return fail(path, 404, 'REVIEW_NOT_FOUND', '리뷰를 찾을 수 없습니다.');
        }

        const result: ReviewDetailResult = { review };
        return ok(path, result, '리뷰가 성공적으로 조회되었습니다.');
    }),

    // 작품 상세 조회 (인증 필요, 본인 예약과 연결된 작품).
    // plan: docs/exec-plans/active/유저 예약 - 작품 상세 조회.md API Contract (스냅샷) 기준.
    // 시뮬 토글:
    //   ?unauth=1 → 401 UNAUTHORIZED
    //   ?simulate=403 → 403 FORBIDDEN (타인 작품 가정)
    //   ?simulate=404 → 404 ARTWORK_NOT_FOUND
    //   ?simulate=500 → 500 INTERNAL_SERVER_ERROR
    //   ?empty=1 → timeline 빈 배열 (등록 단계 없음)
    http.get(`${API}/artworks/:artworkId`, ({ params, request }) => {
        const artworkId = String(params.artworkId);
        const path = `/api/v1/artworks/${artworkId}`;
        const url = new URL(request.url);

        if (url.searchParams.get('unauth') === '1') {
            return fail(path, 401, 'UNAUTHORIZED', '인증이 필요합니다.');
        }
        const simulate = url.searchParams.get('simulate');
        if (simulate === '500') {
            return fail(
                path,
                500,
                'INTERNAL_SERVER_ERROR',
                '작품 제작 단계 조회 중 서버 오류가 발생했습니다.',
            );
        }
        if (simulate === '403') {
            return fail(path, 403, 'FORBIDDEN', '해당 작품에 대한 접근 권한이 없습니다.');
        }
        if (simulate === '404') {
            return fail(path, 404, 'ARTWORK_NOT_FOUND', '작품을 찾을 수 없습니다.');
        }

        const artwork = findArtworkDetail(artworkId);
        if (!artwork) {
            return fail(path, 404, 'ARTWORK_NOT_FOUND', '작품을 찾을 수 없습니다.');
        }

        // ?empty=1 → timeline 빈 배열 변형.
        if (url.searchParams.get('empty') === '1') {
            const result: ArtworkDetailResult = {
                artwork: { ...artwork, timeline: [] },
            };
            return ok(path, result, '작품 제작 단계가 성공적으로 조회되었습니다.');
        }

        const result: ArtworkDetailResult = { artwork };
        return ok(path, result, '작품 제작 단계가 성공적으로 조회되었습니다.');
    }),
];
