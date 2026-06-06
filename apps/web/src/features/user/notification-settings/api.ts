import type {
    GetNotificationSettingsResponse,
    PatchNotificationSettingsBody,
    PatchNotificationSettingsResponse,
} from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/api/v1';

// GET /users/me/notification-settings — 알림 설정 조회
// contract: docs/exec-plans/active/마이페이지.md
export function getNotificationSettings() {
    return clientApiFetch<GetNotificationSettingsResponse>(
        `${BASE}/users/me/notification-settings`,
        {
            method: 'GET',
        },
    );
}

// PATCH /users/me/notification-settings — 알림 설정 토글
export function patchNotificationSettings(body: PatchNotificationSettingsBody) {
    return clientApiFetch<PatchNotificationSettingsResponse>(
        `${BASE}/users/me/notification-settings`,
        {
            method: 'PATCH',
            body,
        },
    );
}
