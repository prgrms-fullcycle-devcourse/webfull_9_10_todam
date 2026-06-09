import {
    deliveryEditRequestSchema,
    DeliveryEditErrorCode,
    ReservationDeliveryMethod,
    RESERVATION_LIST_DEFAULT_LIMIT,
    ReservationStatus,
    StoreRegistrationErrorCode,
    StoreTimeSlotStatus,
    reviewWriteRequestSchema,
    ProgramEditErrorCode,
    createUserReservationRequestSchema,
    ReservationCreateErrorCode,
    AUTOCOMPLETE_ERROR_CODES,
    type DeliveryEditResult,
    type ArtworkDetailResult,
    type GeocodeResult,
    type ReservationDetailResult,
    type ReservationListResult,
    type ReviewDetailResult,
    type ReviewCreateResult,
    type ReviewUpdateResult,
    type ReviewImageUploadRequest,
    type ReviewImageUploadResult,
    type ToggleFavoriteResult,
    type FavoriteStoreListResult,
    type ProgramDetailResult,
    type ProgramReviewListResult,
    type StoreReviewListResult,
    type ProgramEditResult,
    type GetMyProfileResponse,
    type UpdateMyProfileResponse,
    type GetNotificationSettingsResponse,
    type PatchNotificationSettingsResponse,
    type AvailableSlotsResult,
    type CreateUserReservationResult,
    type StoreListResult,
    type AutocompleteResult,
} from '@todam/shared';
import { http, HttpResponse } from 'msw';

import {
    findArtworkDetail,
    findProgramBySlugAndId,
    findProgramByStoreAndId,
    findPublicStoreBySlug,
    updateProgram,
    programToApiShape,
    findReservationDetail,
    findReviewByReservation,
    createReview,
    updateReview,
    createReviewImageUpload,
    listFavoriteStores,
    listStoreReviews,
    listMyReservations,
    mockGeocode,
    nowIso,
    toggleFavorite,
    upsertDeliveryEdit,
} from './db';

const FAVORITE_LIST_DEFAULT_LIMIT = 10;

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

    // GET /stores/{slug}
    http.get(`${API}/stores/:slug`, ({ params }) => {
        const slug = String(params.slug);
        const path = `/api/v1/stores/${slug}`;
        const store = findPublicStoreBySlug(slug);

        if (!store) {
            return fail(path, 404, 'STORE_NOT_FOUND', '공방을 찾을 수 없습니다.');
        }

        return ok(path, { store }, '공방 상세가 조회되었습니다.');
    }),

    // GET /stores/{slug}/reviews
    http.get(`${API}/stores/:slug/reviews`, ({ request, params }) => {
        const slug = String(params.slug);
        const path = `/api/v1/stores/${slug}/reviews`;
        const url = new URL(request.url);
        const cursor = url.searchParams.get('cursor');
        const limitParam = Number(url.searchParams.get('limit'));
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 10;
        const sort = url.searchParams.get('sort') === 'rating_high' ? 'rating_high' : 'latest';

        const result = listStoreReviews(slug, cursor, limit, sort);
        if (!result) {
            return fail(path, 404, 'STORE_NOT_FOUND', '공방을 찾을 수 없습니다.');
        }

        return ok<StoreReviewListResult>(
            path,
            result,
            '공방 리뷰 목록이 성공적으로 조회되었습니다.',
        );
    }),

    // GET /stores/{slug}/programs/{programId}/reviews
    http.get(`${API}/stores/:slug/programs/:programId/reviews`, ({ request, params }) => {
        const slug = String(params.slug);
        const programId = String(params.programId);
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') ?? '1');
        const limit = Number(url.searchParams.get('limit') ?? '10');
        const path = `/api/v1/stores/${slug}/programs/${programId}/reviews`;

        const program = findProgramBySlugAndId(slug, programId);
        if (!program) {
            return fail(
                path,
                404,
                ProgramEditErrorCode.PROGRAM_NOT_FOUND,
                '프로그램을 찾을 수 없습니다.',
            );
        }

        const allReviews: ProgramReviewListResult['reviews'] = [
            {
                id: 'review-program-001',
                userId: 'user-seed-001',
                nickname: '토담이',
                rating: 5,
                content: '차분하게 알려주셔서 처음인데도 즐겁게 만들었어요.',
                photos: [{ thumbnailUrl: 'https://placehold.co/240x240?text=review' }],
                createdAt: '2026-05-10T12:00:00.000Z',
            },
            {
                id: 'review-program-002',
                userId: 'user-seed-002',
                nickname: '흙손',
                rating: 4,
                content: '완성된 작품을 기다리는 과정도 좋았습니다.',
                photos: [],
                createdAt: '2026-05-08T12:00:00.000Z',
            },
        ];
        const offset = Math.max(0, page - 1) * limit;
        const reviews = allReviews.slice(offset, offset + limit);
        const result: ProgramReviewListResult = {
            totalCount: 24,
            averageRating: 4.7,
            reviews,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(24 / limit),
                limit,
            },
        };
        return ok(path, result, '리뷰 목록이 성공적으로 조회되었습니다.');
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

    // 공방 찜 등록/해제 (토글). Request body 없음 — path param storeId 만.
    // plan: docs/exec-plans/active/유저 마이 - 찜한 공방 목록 조회, 공방 찜 등록_해제.md
    // 실 BE 연동: 토글은 root 경로(/stores/...)로 실연동 → mock 핸들러도 prefix 없이 매칭. 시뮬: ?unauth=1 → 401.
    http.post(`*/stores/:storeId/favorite`, ({ params, request }) => {
        const storeId = String(params.storeId);
        const path = `/stores/${storeId}/favorite`;
        const url = new URL(request.url);

        if (url.searchParams.get('unauth') === '1') {
            return fail(path, 401, 'UNAUTHORIZED', '찜하기 기능을 이용하려면 로그인이 필요합니다.');
        }

        const isFavorite = toggleFavorite(storeId);
        const result: ToggleFavoriteResult = { storeId, isFavorite };
        return ok(path, result, isFavorite ? '찜했습니다.' : '찜을 해제했습니다.');
    }),

    // 찜한 공방 목록 조회 (인증 필요, 본인 찜만, 커서 페이지네이션, PUBLISHED·최신 찜순).
    // plan: docs/exec-plans/active/유저 마이 - 찜한 공방 목록 조회, 공방 찜 등록_해제.md
    // 시뮬: ?unauth=1 → 401, ?empty=1 → 빈 목록, ?simulate=500 → 500.
    http.get(`${API}/users/me/favorite-stores`, ({ request }) => {
        const path = '/api/v1/users/me/favorite-stores';
        const url = new URL(request.url);

        if (url.searchParams.get('unauth') === '1') {
            return fail(path, 401, 'UNAUTHORIZED', '찜하기 기능을 이용하려면 로그인이 필요합니다.');
        }
        if (url.searchParams.get('simulate') === '500') {
            return fail(
                path,
                500,
                'INTERNAL_SERVER_ERROR',
                '찜한 공방 조회 중 서버 오류가 발생했습니다.',
            );
        }
        if (url.searchParams.get('empty') === '1') {
            const result: FavoriteStoreListResult = { favoriteStores: [], nextCursor: null };
            return ok(path, result, '찜한 공방 목록이 성공적으로 조회되었습니다.');
        }

        const cursor = url.searchParams.get('cursor');
        const limitParam = Number(url.searchParams.get('limit'));
        const limit =
            Number.isFinite(limitParam) && limitParam > 0
                ? limitParam
                : FAVORITE_LIST_DEFAULT_LIMIT;

        const result: FavoriteStoreListResult = listFavoriteStores(cursor, limit);
        return ok(path, result, '찜한 공방 목록이 성공적으로 조회되었습니다.');
    }),

    // ─── 예약 가능 슬롯 조회 ───────────────────────────────────────────
    // GET /programs/{programId}/available-slots?year=&month=
    // plan: docs/exec-plans/active/user-예약-신청.md API Contract (스냅샷).
    // 시뮬: ?year&month 의 5·12·20일에 10:00/14:00 슬롯 생성. 12일 14시=CLOSED, 20일 14시=만석(isAvailable=false).
    http.get('*/programs/:programId/available-slots', ({ request, params }) => {
        const programId = String(params.programId);
        const path = `/programs/${programId}/available-slots`;
        const url = new URL(request.url);

        if (url.searchParams.get('simulate') === '404') {
            return fail(
                path,
                404,
                ReservationCreateErrorCode.PROGRAM_NOT_FOUND,
                '프로그램을 찾을 수 없습니다.',
            );
        }

        const now = new Date();
        const year = Number(url.searchParams.get('year')) || now.getFullYear();
        const month = Number(url.searchParams.get('month')) || now.getMonth() + 1;
        const max = 4; // mock Store.maxCapacityPerSlot

        const iso = (day: number, hour: number) =>
            new Date(Date.UTC(year, month - 1, day, hour, 0, 0)).toISOString();
        const slot = (
            id: string,
            day: number,
            hour: number,
            reserved: number,
            status: StoreTimeSlotStatus,
        ) => {
            const remainingCount = Math.max(0, max - reserved);
            return {
                slotId: id,
                startAt: iso(day, hour),
                endAt: iso(day, hour + 2),
                reservedCount: reserved,
                remainingCount,
                status,
                isAvailable: status === StoreTimeSlotStatus.OPEN && remainingCount > 0,
            };
        };

        const result: AvailableSlotsResult = {
            slots: [
                slot('slot-05-10', 5, 10, 1, StoreTimeSlotStatus.OPEN),
                slot('slot-05-14', 5, 14, 2, StoreTimeSlotStatus.OPEN),
                slot('slot-12-10', 12, 10, 0, StoreTimeSlotStatus.OPEN),
                slot('slot-12-14-blocked', 12, 14, 2, StoreTimeSlotStatus.CLOSED),
                slot('slot-20-10', 20, 10, 3, StoreTimeSlotStatus.OPEN),
                slot('slot-20-14-full', 20, 14, 4, StoreTimeSlotStatus.OPEN),
            ],
        };
        return ok(path, result, '예약 가능 시간 목록이 성공적으로 조회되었습니다.');
    }),

    // ─── 예약 생성 ─────────────────────────────────────────────────────
    // POST /reservations
    // plan: docs/exec-plans/active/user-예약-신청.md API Contract (스냅샷).
    // 시뮬: slotId 에 'blocked' 포함→SLOT_BLOCKED, 'full' 포함→INSUFFICIENT_CAPACITY,
    //       'auto' 포함→CONFIRMED, 그 외 PENDING.
    http.post(/^https?:\/\/[^/]+\/reservations(\?.*)?$/, async ({ request }) => {
        const path = '/reservations';

        const parsed = createUserReservationRequestSchema.safeParse(await request.json());
        if (!parsed.success) {
            return fail(path, 400, 'VALIDATION_ERROR', '요청 형식이 올바르지 않습니다.');
        }
        const body = parsed.data;

        if (body.slotId.includes('blocked')) {
            return fail(
                path,
                409,
                ReservationCreateErrorCode.SLOT_BLOCKED,
                '예약이 불가한 슬롯입니다.',
            );
        }
        if (body.slotId.includes('full')) {
            return fail(
                path,
                400,
                ReservationCreateErrorCode.INSUFFICIENT_CAPACITY,
                '잔여 정원이 부족합니다.',
            );
        }

        const confirmed = body.slotId.includes('auto');
        const status = confirmed ? ReservationStatus.CONFIRMED : ReservationStatus.PENDING;
        const result: CreateUserReservationResult = {
            reservation: {
                id: `res-${Date.now()}`,
                programId: body.programId,
                slotId: body.slotId,
                reserverName: body.reserverName,
                participantCount: body.participantCount,
                status,
                displayState: confirmed
                    ? { label: '예약확정', description: '예약이 확정되었어요.', subLabel: null }
                    : {
                          label: '예약신청',
                          description: '작가님이 예약 내용을 확인하고 있어요.',
                          subLabel: null,
                      },
                createdAt: nowIso(),
            },
        };
        return ok(path, result, '예약이 성공적으로 접수되었습니다.', 201);
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

    // 리뷰 작성 — POST /reservations/{reservationId}/review (201).
    // ?unauth=1 → 401, ?simulate=403|404|409|500 토글, 그 외 201.
    http.post(`${API}/reservations/:reservationId/review`, async ({ params, request }) => {
        const reservationId = String(params.reservationId);
        const path = `/api/v1/reservations/${reservationId}/review`;
        const url = new URL(request.url);

        if (url.searchParams.get('unauth') === '1') {
            return fail(path, 401, 'UNAUTHORIZED', '인증 정보가 유효하지 않거나 만료되었습니다.');
        }
        const sim = url.searchParams.get('simulate');
        if (sim === '403')
            return fail(
                path,
                403,
                'FORBIDDEN',
                '본인이 참여한 예약 정보에 대해서만 리뷰 작성이 허용됩니다.',
            );
        if (sim === '404')
            return fail(
                path,
                404,
                'RESERVATION_NOT_FOUND',
                '요청하신 예약 정보를 찾을 수 없습니다.',
            );
        if (sim === '409')
            return fail(path, 409, 'REVIEW_ALREADY_EXISTS', '이미 리뷰를 작성한 예약입니다.');
        if (sim === '500')
            return fail(
                path,
                500,
                'INTERNAL_SERVER_ERROR',
                '리뷰 등록 중 서버 오류가 발생했습니다.',
            );

        const parsed = reviewWriteRequestSchema.safeParse(await request.json());
        if (!parsed.success) {
            return fail(path, 400, 'BAD_REQUEST', '요청 값이 올바르지 않습니다.');
        }
        const review = createReview(reservationId, parsed.data);
        const result: ReviewCreateResult = { review };
        return ok(path, result, '리뷰가 성공적으로 등록되었습니다.', 201);
    }),

    // 리뷰 수정 — PATCH /reviews/{reviewId} (200). 응답 shape: D15(photos URL[] + updatedAt).
    // ?unauth=1 → 401, ?simulate=400|403|500 토글, 미존재 → 404.
    http.patch(`${API}/reviews/:reviewId`, async ({ params, request }) => {
        const reviewId = String(params.reviewId);
        const path = `/api/v1/reviews/${reviewId}`;
        const url = new URL(request.url);

        if (url.searchParams.get('unauth') === '1') {
            return fail(path, 401, 'UNAUTHORIZED', '인증 정보가 유효하지 않거나 만료되었습니다.');
        }
        const sim = url.searchParams.get('simulate');
        if (sim === '400')
            return fail(
                path,
                400,
                'REVIEW_EDIT_DEADLINE_EXCEEDED',
                '리뷰 수정이 가능한 기한(작성일로부터 30일 이내)이 경과하여 수정을 완료할 수 없습니다.',
            );
        if (sim === '403')
            return fail(
                path,
                403,
                'FORBIDDEN',
                '자신이 직접 등록한 리뷰에 대해서만 수정이 가능합니다.',
            );
        if (sim === '500')
            return fail(
                path,
                500,
                'INTERNAL_SERVER_ERROR',
                '리뷰 수정 중 서버 오류가 발생했습니다.',
            );

        const parsed = reviewWriteRequestSchema.safeParse(await request.json());
        if (!parsed.success) {
            return fail(path, 400, 'BAD_REQUEST', '요청 값이 올바르지 않습니다.');
        }
        const review = updateReview(reviewId, parsed.data);
        if (!review) {
            return fail(path, 404, 'REVIEW_NOT_FOUND', '리뷰를 찾을 수 없습니다.');
        }
        // D15: PATCH 응답은 photos URL 문자열배열 + updatedAt.
        const result: ReviewUpdateResult = {
            review: {
                id: review.id,
                rating: review.rating,
                content: review.content,
                photos: review.photos.map((p) => p.imageUrl),
                updatedAt: nowIso(),
            },
        };
        return ok(path, result, '리뷰가 성공적으로 수정되었습니다.');
    }),

    // 리뷰 사진 presigned — POST /review/images/presigned (D14 추론 mock). 응답에 S3 key 포함.
    http.post(`${API}/review/images/presigned`, async ({ request }) => {
        const path = '/api/v1/review/images/presigned';
        const body = (await request.json()) as ReviewImageUploadRequest;
        const result: ReviewImageUploadResult = createReviewImageUpload(body.fileName);
        return ok(
            path,
            result,
            'Pre-signed URL이 성공적으로 발급되었습니다. 5분 이내에 업로드를 완료해주세요.',
            201,
        );
    }),

    // 리뷰 삭제 (DELETE /reviews/:reviewId).
    // contract: docs/exec-plans/active/유저 예약 - 나의 리뷰 상세 조회, 나의 리뷰 삭제.md
    //   ?unauth=1 → 401 UNAUTHORIZED
    //   ?simulate=403 → 403 FORBIDDEN (타인 리뷰 가정)
    //   ?simulate=404 → 404 REVIEW_NOT_FOUND (이미 삭제됨)
    //   ?simulate=500 → 500 INTERNAL_SERVER_ERROR
    //   정상 → 200 data:null
    http.delete(`${API}/reviews/:reviewId`, ({ params, request }) => {
        const reviewId = String(params.reviewId);
        const path = `/api/v1/reviews/${reviewId}`;
        const url = new URL(request.url);

        if (url.searchParams.get('unauth') === '1') {
            return fail(path, 401, 'UNAUTHORIZED', '인증이 필요합니다.');
        }

        const simulate = url.searchParams.get('simulate');
        if (simulate === '403') {
            return fail(path, 403, 'FORBIDDEN', '해당 리뷰에 대한 접근 권한이 없습니다.');
        }
        if (simulate === '404') {
            return fail(path, 404, 'REVIEW_NOT_FOUND', '리뷰를 찾을 수 없습니다.');
        }
        if (simulate === '500') {
            return fail(
                path,
                500,
                'INTERNAL_SERVER_ERROR',
                '리뷰 삭제 중 서버 오류가 발생했습니다.',
            );
        }

        return ok(path, null, '리뷰가 성공적으로 삭제되었습니다.');
    }),

    // 배송 정보 등록/수정 (인증 필요, 본인 예약만, DELIVERY 만)
    // contract: docs/exec-plans/active/유저 예약 - 나의 배송 정보 수정.md API Contract (스냅샷)
    // 시뮬 토글(URL forwarding 미적용 환경 한정):
    //   ?unauth=1 → 401 UNAUTHORIZED
    //   ?simulate=403 → 403 FORBIDDEN (타인 예약 가정)
    //   ?simulate=404 → 404 RESERVATION_NOT_FOUND
    //   ?simulate=409 → 409 DELIVERY_NOT_EDITABLE
    //   ?simulate=500 → 500 INTERNAL_SERVER_ERROR
    http.patch(`${API}/reservations/:reservationId/delivery`, async ({ params, request }) => {
        const reservationId = String(params.reservationId);
        const path = `/api/v1/reservations/${reservationId}/delivery`;
        const url = new URL(request.url);

        if (url.searchParams.get('unauth') === '1') {
            return fail(path, 401, DeliveryEditErrorCode.UNAUTHORIZED, '인증이 필요합니다.');
        }
        const simulate = url.searchParams.get('simulate');
        if (simulate === '500') {
            return fail(
                path,
                500,
                DeliveryEditErrorCode.INTERNAL_SERVER_ERROR,
                '배송 정보 저장 중 서버 오류가 발생했습니다.',
            );
        }
        if (simulate === '403') {
            return fail(
                path,
                403,
                DeliveryEditErrorCode.FORBIDDEN,
                '본인 예약의 배송 정보만 수정할 수 있습니다.',
            );
        }
        if (simulate === '404') {
            return fail(
                path,
                404,
                DeliveryEditErrorCode.RESERVATION_NOT_FOUND,
                '예약을 찾을 수 없습니다.',
            );
        }
        if (simulate === '409') {
            return fail(
                path,
                409,
                DeliveryEditErrorCode.DELIVERY_NOT_EDITABLE,
                '이미 발송된 작품의 배송 정보는 수정할 수 없습니다.',
            );
        }

        const reservation = findReservationDetail(reservationId);
        if (!reservation) {
            return fail(
                path,
                404,
                DeliveryEditErrorCode.RESERVATION_NOT_FOUND,
                '예약을 찾을 수 없습니다.',
            );
        }

        // PICKUP 예약 — 본 endpoint 자체로 거부 (FE 가드와 정합).
        if (reservation.deliveryMethod === ReservationDeliveryMethod.PICKUP) {
            return fail(
                path,
                409,
                DeliveryEditErrorCode.DELIVERY_NOT_EDITABLE,
                '픽업 예약은 배송 정보를 수정할 수 없습니다.',
            );
        }

        // 잠금 상태 — SHIPPED/DELIVERED 는 수정 불가 (FE 가드와 정합).
        if (
            reservation.status === ReservationStatus.SHIPPED ||
            reservation.status === ReservationStatus.DELIVERED
        ) {
            return fail(
                path,
                409,
                DeliveryEditErrorCode.DELIVERY_NOT_EDITABLE,
                '이미 발송된 작품의 배송 정보는 수정할 수 없습니다.',
            );
        }

        const raw = await request.json();
        const parsed = deliveryEditRequestSchema.safeParse(raw);
        if (!parsed.success) {
            return fail(
                path,
                400,
                DeliveryEditErrorCode.DELIVERY_INFO_INVALID,
                parsed.error.issues[0]?.message ??
                    '필수 배송 정보(수령인·연락처·주소)를 입력해야 합니다.',
            );
        }

        const saved = upsertDeliveryEdit(reservationId, parsed.data);
        const result: DeliveryEditResult = { delivery: saved };
        return ok(path, result, '배송 정보가 저장되었습니다.');
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

    // ─── 내 프로필 조회 (GET /api/v1/users/me) ───────────────────────────────
    // contract: docs/exec-plans/active/마이페이지.md
    // 시뮬: ?unauth=1 → 401, ?simulate=404 → 404 USER_NOT_FOUND, ?simulate=500 → 500
    http.get(`${API}/users/me`, ({ request }) => {
        const path = '/api/v1/users/me';
        const url = new URL(request.url);

        // notification-settings 경로가 먼저 매칭되도록 별도 핸들러로 분리.
        // 이 핸들러는 /users/me 정확 매칭.

        if (url.searchParams.get('unauth') === '1') {
            return fail(path, 401, 'UNAUTHORIZED', '인증 정보가 유효하지 않거나 만료되었습니다.');
        }
        const simulate = url.searchParams.get('simulate');
        if (simulate === '404') {
            return fail(path, 404, 'USER_NOT_FOUND', '존재하지 않거나 탈퇴 처리된 회원입니다.');
        }
        if (simulate === '500') {
            return fail(
                path,
                500,
                'INTERNAL_SERVER_ERROR',
                '프로필 조회 처리 중 서버 내부 오류가 발생했습니다.',
            );
        }

        const result: GetMyProfileResponse = {
            user: {
                userId: 'eb50a73f-785f-49ce-887b-5f0bba67a1e3',
                email: 'user@example.com',
                nickname: '토담이',
                isPartner: false,
                createdAt: '2026-05-24T16:55:00.000Z',
            },
        };
        return ok(path, result, '프로필이 성공적으로 조회되었습니다.');
    }),

    // ─── 내 프로필 수정 (PATCH /api/v1/users/me) ─────────────────────────────
    // contract: docs/exec-plans/active/마이페이지.md
    // 시뮬: ?unauth=1 → 401, ?simulate=409 → 409 NICKNAME_ALREADY_EXISTS, ?simulate=400 → 400 INVALID_REQUEST
    http.patch(`${API}/users/me`, async ({ request }) => {
        const path = '/api/v1/users/me';
        const url = new URL(request.url);

        if (url.searchParams.get('unauth') === '1') {
            return fail(path, 401, 'UNAUTHORIZED', '인증 정보가 유효하지 않거나 만료되었습니다.');
        }
        const simulate = url.searchParams.get('simulate');
        if (simulate === '409') {
            return fail(
                path,
                409,
                'NICKNAME_ALREADY_EXISTS',
                '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.',
            );
        }
        if (simulate === '400') {
            return fail(
                path,
                400,
                'INVALID_REQUEST',
                '닉네임은 특수문자를 제외한 2자 이상 10자 이내여야 합니다.',
            );
        }

        const body = (await request.json()) as { nickname?: string };
        const nickname = body.nickname ?? '새닉네임';
        const result: UpdateMyProfileResponse = {
            user: {
                userId: 'eb50a73f-785f-49ce-887b-5f0bba67a1e3',
                email: 'user@example.com',
                nickname,
                isPartner: false,
                updatedAt: new Date().toISOString(),
            },
        };
        return ok(path, result, '프로필이 성공적으로 수정되었습니다.');
    }),

    // ─── 알림 설정 조회 (GET /api/v1/users/me/notification-settings) ──────────
    // contract: docs/exec-plans/active/마이페이지.md
    // 시뮬: ?unauth=1 → 401, ?simulate=500 → 500
    http.get(`${API}/users/me/notification-settings`, ({ request }) => {
        const path = '/api/v1/users/me/notification-settings';
        const url = new URL(request.url);

        if (url.searchParams.get('unauth') === '1') {
            return fail(path, 401, 'UNAUTHORIZED', '인증 정보가 유효하지 않거나 만료되었습니다.');
        }
        if (url.searchParams.get('simulate') === '500') {
            return fail(
                path,
                500,
                'INTERNAL_SERVER_ERROR',
                '알림 설정 조회 중 서버 오류가 발생했습니다.',
            );
        }

        const result: GetNotificationSettingsResponse = {
            notificationSettings: {
                id: 'ns-mock-001',
                userId: 'eb50a73f-785f-49ce-887b-5f0bba67a1e3',
                inAppEnabled: true,
                emailEnabled: true,
                kakaoEnabled: true,
                reservationEnabled: true,
                artworkEnabled: true,
                shippingEnabled: true,
                marketingEnabled: false,
                updatedAt: '2026-05-25T16:00:00.000Z',
            },
        };
        return ok(path, result, '알림 설정이 성공적으로 조회되었습니다.');
    }),

    // ─── 공방 검색 결과 (GET /api/v1/stores) ───────────────────────────────────
    // contract: docs/exec-plans/active/user-stores-keyword.md API Contract A
    // 인증 불필요(공개). keyword 매칭(name/address/program title), matchedClass 포함.
    // 시뮬: ?simulate=500 → 500 / ?empty=1 → 빈 결과.
    // 주의: /stores/:slug 보다 먼저 등록해야 하지만 MSW는 등록 순서대로 매칭하므로
    //       /stores/search/autocomplete 를 /stores/:slug 보다 먼저 위치시킴.
    http.get(`${API}/stores`, ({ request }) => {
        const path = '/api/v1/stores';
        const url = new URL(request.url);

        if (url.searchParams.get('simulate') === '500') {
            return fail(
                path,
                500,
                'INTERNAL_SERVER_ERROR',
                '공방 검색 중 서버 오류가 발생했습니다.',
            );
        }
        if (url.searchParams.get('empty') === '1') {
            const result: StoreListResult = {
                stores: [],
                pageInfo: { nextCursor: null, hasNext: false },
            };
            return ok(path, result, '공방 목록이 성공적으로 조회되었습니다.');
        }

        const keyword = url.searchParams.get('keyword') ?? '';
        const cursor = url.searchParams.get('cursor');
        const limitParam = Number(url.searchParams.get('limit'));
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 10;

        // mock 데이터 — plan API Contract A 스냅샷 형태
        const MOCK_STORES: StoreListResult['stores'] = [
            {
                id: 'store-uuid-001',
                slug: 'plus-doja',
                name: '플러스 도자기',
                region: { sido: '서울', sigungu: '성동구', dong: '성수동' },
                thumbnailUrl: 'https://placehold.co/80x80?text=pottery',
                rating: 4.9,
                reviewCount: 253,
                distance: 1200,
                representativeClass: { name: '머그컵 만들기', price: 30000, hasMore: true },
                matchedClass: null,
                isOperating: true,
            },
            {
                id: 'store-uuid-002',
                slug: 'todam-pottery',
                name: '흙과 사람',
                region: { sido: '서울', sigungu: '성동구', dong: '성수동' },
                thumbnailUrl: 'https://placehold.co/80x80?text=clay',
                rating: 4.8,
                reviewCount: 180,
                distance: 2300,
                representativeClass: { name: '물레 체험 기초반', price: 45000, hasMore: false },
                matchedClass: null,
                isOperating: true,
            },
            {
                id: 'store-uuid-003',
                slug: 'clay-seoul',
                name: '클레이 서울',
                region: { sido: '서울', sigungu: '종로구', dong: '통인동' },
                thumbnailUrl: 'https://placehold.co/80x80?text=craft',
                rating: 4.7,
                reviewCount: 92,
                distance: 5600,
                representativeClass: { name: '핸드빌딩 기초', price: 35000, hasMore: false },
                matchedClass: null,
                isOperating: false,
            },
            {
                id: 'store-uuid-004',
                slug: 'seongsu-vintage',
                name: '성수동 작은 공방',
                region: { sido: '서울', sigungu: '성동구', dong: '성수동' },
                thumbnailUrl: 'https://placehold.co/80x80?text=vintage',
                rating: 4.6,
                reviewCount: 47,
                distance: 16400,
                representativeClass: null,
                // 키워드가 프로그램명에 매칭된 경우 matchedClass 세팅 예시
                matchedClass: { name: '성수동 감성 빈티지 볼 그릇', price: 45000 },
                isOperating: true,
            },
        ];

        // keyword 부분 매칭 필터 (mock — name/region/program title)
        let filtered = MOCK_STORES;
        if (keyword.trim()) {
            const kw = keyword.trim().toLowerCase();
            filtered = MOCK_STORES.filter(
                (s) =>
                    s.name.toLowerCase().includes(kw) ||
                    s.region.dong.toLowerCase().includes(kw) ||
                    s.region.sigungu.toLowerCase().includes(kw) ||
                    (s.representativeClass?.name.toLowerCase().includes(kw) ?? false) ||
                    (s.matchedClass?.name.toLowerCase().includes(kw) ?? false),
            );
        }

        // 커서 기반 페이지네이션
        let startIdx = 0;
        if (cursor) {
            const idx = filtered.findIndex((s) => s.id === cursor);
            startIdx = idx >= 0 ? idx + 1 : filtered.length;
        }
        const window = filtered.slice(startIdx, startIdx + limit + 1);
        const hasNext = window.length > limit;
        const stores = window.slice(0, limit);
        const nextCursor = hasNext ? (stores[stores.length - 1]?.id ?? null) : null;

        const result: StoreListResult = { stores, pageInfo: { nextCursor, hasNext } };
        return ok(path, result, '공방 목록이 성공적으로 조회되었습니다.');
    }),

    // ─── 공방 자동완성 (GET /api/v1/stores/search/autocomplete) ─────────────
    // contract: docs/exec-plans/active/user-stores-keyword.md API Contract B
    // keyword 필수(공백 불가) → 없으면 400 KEYWORD_REQUIRED.
    // REGION ≤ 3 / STORE ≤ 5 / PROGRAM ≤ 5.
    // 주의: /stores/:slug 패턴보다 먼저 배치 (MSW 순서 매칭).
    http.get(`${API}/stores/search/autocomplete`, ({ request }) => {
        const path = '/api/v1/stores/search/autocomplete';
        const url = new URL(request.url);
        const keyword = url.searchParams.get('keyword') ?? '';

        if (!keyword.trim()) {
            return fail(
                path,
                400,
                AUTOCOMPLETE_ERROR_CODES.KEYWORD_REQUIRED,
                'keyword는 필수이며 공백일 수 없습니다.',
            );
        }

        const kw = keyword.trim().toLowerCase();

        // mock 자동완성 후보
        const ALL_REGIONS = [
            { id: 'seongdong-seongsu', text: '성수동', subtitle: '서울 성동구 성수동' },
            { id: 'jongno-tongin', text: '통인동', subtitle: '서울 종로구 통인동' },
            { id: 'mapo-yeonnam', text: '연남동', subtitle: '서울 마포구 연남동' },
            { id: 'seongbuk-anam', text: '안암동', subtitle: '서울 성북구 안암동' },
        ];
        const ALL_STORES = [
            { id: 'store-uuid-001', text: '플러스 도자기', subtitle: '서울 성동구 성수동' },
            { id: 'store-uuid-002', text: '흙과 사람', subtitle: '서울 성동구 성수동' },
            { id: 'store-uuid-003', text: '클레이 서울', subtitle: '서울 종로구 통인동' },
            { id: 'store-uuid-004', text: '성수동 작은 공방', subtitle: '서울 성동구 성수동' },
            { id: 'store-uuid-005', text: '성수 도예원', subtitle: '서울 성동구 성수동' },
            { id: 'store-uuid-006', text: '온도 스튜디오', subtitle: '서울 용산구 이태원동' },
        ];
        const ALL_PROGRAMS = [
            { id: 'prog-uuid-001', text: '성수동 감성 머그컵', subtitle: null },
            { id: 'prog-uuid-002', text: '물레 체험 기초반', subtitle: null },
            { id: 'prog-uuid-003', text: '핸드빌딩 머그컵 만들기', subtitle: null },
            { id: 'prog-uuid-004', text: '성수동 감성 빈티지 볼 그릇', subtitle: null },
            { id: 'prog-uuid-005', text: '커플 도자기 클래스', subtitle: null },
            { id: 'prog-uuid-006', text: '화병 클래스', subtitle: null },
        ];

        const matchRegions = ALL_REGIONS.filter((r) => r.text.toLowerCase().includes(kw)).slice(
            0,
            3,
        );
        const matchStores = ALL_STORES.filter((s) => s.text.toLowerCase().includes(kw)).slice(0, 5);
        const matchPrograms = ALL_PROGRAMS.filter((p) => p.text.toLowerCase().includes(kw)).slice(
            0,
            5,
        );

        const suggestions: AutocompleteResult['suggestions'] = [
            ...matchRegions.map((r) => ({ type: 'REGION' as const, ...r })),
            ...matchStores.map((s) => ({ type: 'STORE' as const, ...s })),
            ...matchPrograms.map((p) => ({ type: 'PROGRAM' as const, ...p })),
        ];

        const result: AutocompleteResult = { suggestions };
        return ok(path, result, '자동완성 목록 조회가 완료되었습니다.');
    }),

    // ─── 알림 설정 수정 (PATCH /api/v1/users/me/notification-settings) ────────
    // contract: docs/exec-plans/active/마이페이지.md
    // 시뮬: ?unauth=1 → 401
    http.patch(`${API}/users/me/notification-settings`, async ({ request }) => {
        const path = '/api/v1/users/me/notification-settings';
        const url = new URL(request.url);

        if (url.searchParams.get('unauth') === '1') {
            return fail(path, 401, 'UNAUTHORIZED', '인증 정보가 유효하지 않거나 만료되었습니다.');
        }

        const body = (await request.json()) as Record<string, unknown>;
        const result: PatchNotificationSettingsResponse = {
            notificationSettings: {
                id: 'ns-mock-001',
                userId: 'eb50a73f-785f-49ce-887b-5f0bba67a1e3',
                inAppEnabled: true,
                emailEnabled: true,
                kakaoEnabled: true,
                reservationEnabled: true,
                artworkEnabled:
                    typeof body.artworkEnabled === 'boolean' ? body.artworkEnabled : true,
                shippingEnabled: true,
                marketingEnabled:
                    typeof body.marketingEnabled === 'boolean' ? body.marketingEnabled : false,
                updatedAt: new Date().toISOString(),
            },
        };
        return ok(path, result, '알림 설정이 성공적으로 수정되었습니다.');
    }),
];
