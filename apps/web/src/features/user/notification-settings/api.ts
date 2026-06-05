import type {
    GetNotificationSettingsResponse,
    PatchNotificationSettingsBody,
    PatchNotificationSettingsResponse,
} from '@todam/shared';

import { apiFetch } from '@/shared/api';

const BASE = '/api/v1';

// GET /users/me/notification-settings — 알림 설정 조회
// contract: docs/exec-plans/active/마이페이지.md
export function getNotificationSettings() {
    return apiFetch<GetNotificationSettingsResponse>(`${BASE}/users/me/notification-settings`, {
        method: 'GET',
    });
}

// PATCH /users/me/notification-settings — 알림 설정 토글
export function patchNotificationSettings(body: PatchNotificationSettingsBody) {
    return apiFetch<PatchNotificationSettingsResponse>(`${BASE}/users/me/notification-settings`, {
        method: 'PATCH',
        body,
    });
}
