import type {
    GetNotificationSettingsResponse,
    PatchNotificationSettingsBody,
    PatchNotificationSettingsResponse,
} from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

// BE global prefix 없음. 실 경로 = /users/me/notification-settings.
// (BE 미구현 — 현재 MSW 전용. 향후 BE도 user.controller bare 패턴 따를 것.)
// GET /users/me/notification-settings — 알림 설정 조회
// contract: docs/exec-plans/active/마이페이지.md
export function getNotificationSettings() {
    return clientApiFetch<GetNotificationSettingsResponse>('/users/me/notification-settings', {
        method: 'GET',
    });
}

// PATCH /users/me/notification-settings — 알림 설정 토글
export function patchNotificationSettings(body: PatchNotificationSettingsBody) {
    return clientApiFetch<PatchNotificationSettingsResponse>('/users/me/notification-settings', {
        method: 'PATCH',
        body,
    });
}
