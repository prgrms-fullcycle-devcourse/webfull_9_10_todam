import type {
    GetNotificationsQuery,
    GetNotificationsResponse,
    ReadAllNotificationsResponse,
    ReadNotificationResponse,
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

// GET /notifications — 인앱 알림 목록(커서 페이지네이션).
export function getNotifications(query: Partial<GetNotificationsQuery> = {}) {
    const params = new URLSearchParams();
    if (query.cursor) params.set('cursor', query.cursor);
    if (query.limit != null) params.set('limit', String(query.limit));
    if (query.unreadOnly != null) params.set('unreadOnly', String(query.unreadOnly));
    const qs = params.toString();
    return clientApiFetch<GetNotificationsResponse>(`/notifications${qs ? `?${qs}` : ''}`, {
        method: 'GET',
    });
}

// PATCH /notifications/:id/read — 단건 읽음.
export function readNotification(id: string) {
    return clientApiFetch<ReadNotificationResponse>(
        `/notifications/${encodeURIComponent(id)}/read`,
        { method: 'PATCH' },
    );
}

// PATCH /notifications/read-all — 전체 읽음.
export function readAllNotifications() {
    return clientApiFetch<ReadAllNotificationsResponse>('/notifications/read-all', {
        method: 'PATCH',
    });
}
