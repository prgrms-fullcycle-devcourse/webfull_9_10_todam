import {
    StoreRegistrationErrorCode,
    storeRegistrationSubmitRequestSchema,
    PartnerStatus,
    StoreStatus,
    ProgramEditErrorCode,
    type GeocodeResult,
    type StoreRegistrationStatusResult,
    type StoreRegistrationSubmitResult,
    type SlugAvailabilityResult,
    type ToggleLikeRequest,
    type ToggleLikeResult,
    type PartnerStoreListResult,
    type ProgramDetailResult,
    type ProgramEditResult,
    type ProgramImageUploadResult,
} from '@todam/shared';
import { http, HttpResponse } from 'msw';

import {
    createStoreRegistration,
    findLatestStoreRegistration,
    findProgramBySlugAndId,
    findProgramByStoreAndId,
    addProgramImage,
    removeProgramImage,
    updateProgram,
    programToApiShape,
    genId,
    isBusinessNumberRegistered,
    isSlugTaken,
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
];
