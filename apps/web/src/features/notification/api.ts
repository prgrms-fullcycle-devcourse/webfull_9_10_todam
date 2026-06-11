import type {
    RegisterNotificationTokenBody,
    RegisterNotificationTokenResponse,
} from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

// POST /notifications/tokens — FCM 토큰 등록/갱신(upsert).
export function registerNotificationToken(body: RegisterNotificationTokenBody) {
    return clientApiFetch<RegisterNotificationTokenResponse>('/notifications/tokens', {
        method: 'POST',
        body,
    });
}

// DELETE /notifications/tokens/:fcmToken — revoke (204 no body).
// 응답 envelope 없을 수 있어(204) best-effort. 로그아웃 흐름을 막지 않도록 호출부에서 catch.
export function revokeNotificationToken(fcmToken: string) {
    return clientApiFetch<unknown>(`/notifications/tokens/${encodeURIComponent(fcmToken)}`, {
        method: 'DELETE',
    });
}
