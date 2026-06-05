'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PatchNotificationSettingsBody } from '@todam/shared';

import { getNotificationSettings, patchNotificationSettings } from './api';

export const NOTIFICATION_SETTINGS_QUERY_KEY = ['users', 'me', 'notification-settings'] as const;

// GET /users/me/notification-settings
export function useNotificationSettings() {
    return useQuery({
        queryKey: NOTIFICATION_SETTINGS_QUERY_KEY,
        queryFn: getNotificationSettings,
    });
}

// PATCH /users/me/notification-settings — 성공 시 캐시 invalidate
export function usePatchNotificationSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: PatchNotificationSettingsBody) => patchNotificationSettings(body),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: NOTIFICATION_SETTINGS_QUERY_KEY });
        },
    });
}
