import {
    StoreRegistrationErrorCode,
    type GeocodeResult,
    type GetNotificationSettingsResponse,
    type PatchNotificationSettingsResponse,
} from '@todam/shared';
import { http, HttpResponse } from 'msw';

import { mockGeocode, nowIso } from './db';

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

// 실 BE 미구현(mock-only) 엔드포인트만 유지.
// 실 BE 보유 + FE 구현 완료 기능의 mock 핸들러는 제거됨(#306, 선행 #300).
export const handlers = [
    // 주소 → 좌표 (외부 주소 API mock — 실 BE 없음)
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

    // ─── 알림 설정 조회 (GET /users/me/notification-settings) — 실 BE 미구현 ──
    // contract: docs/exec-plans/active/마이페이지.md
    // 시뮬: ?unauth=1 → 401, ?simulate=500 → 500
    http.get(`*/users/me/notification-settings`, ({ request }) => {
        const path = '/users/me/notification-settings';
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
                webPushEnabled: true,
                reservationEnabled: true,
                artworkEnabled: true,
                shippingEnabled: true,
                marketingEnabled: false,
                updatedAt: '2026-05-25T16:00:00.000Z',
            },
        };
        return ok(path, result, '알림 설정이 성공적으로 조회되었습니다.');
    }),

    // ─── 알림 설정 수정 (PATCH /users/me/notification-settings) — 실 BE 미구현 ──
    // contract: docs/exec-plans/active/마이페이지.md
    // 시뮬: ?unauth=1 → 401
    http.patch(`*/users/me/notification-settings`, async ({ request }) => {
        const path = '/users/me/notification-settings';
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
                webPushEnabled:
                    typeof body.webPushEnabled === 'boolean' ? body.webPushEnabled : true,
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
