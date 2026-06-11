'use client';

import { useCallback } from 'react';
import { getToken } from 'firebase/messaging';

import { registerNotificationToken } from '../api';
import { getMessagingIfSupported, VAPID_KEY } from './firebase';
import { setStoredFcmToken } from './pushToken';

export type EnablePushResult =
    | { ok: true; token: string }
    | { ok: false; reason: 'unsupported' | 'denied' | 'no-token' | 'error' };

// 푸시 활성화 — 반드시 user gesture(버튼 클릭 등) 안에서 호출.
// iOS는 설치된 PWA + 사용자 제스처에서만 권한 요청 가능.
async function enablePush(): Promise<EnablePushResult> {
    try {
        const messaging = await getMessagingIfSupported();
        if (!messaging) return { ok: false, reason: 'unsupported' };

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return { ok: false, reason: 'denied' };

        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
        });
        if (!token) return { ok: false, reason: 'no-token' };

        await registerNotificationToken({ fcmToken: token, userAgent: navigator.userAgent });
        setStoredFcmToken(token);
        return { ok: true, token };
    } catch {
        return { ok: false, reason: 'error' };
    }
}

// 이미 권한 허용된 상태에서 토큰 재발급/서버 재등록(토큰 로테이션 대비). 권한 요청 안 함.
export async function silentReregisterPush(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    try {
        const messaging = await getMessagingIfSupported();
        if (!messaging) return;
        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
        });
        if (!token) return;
        await registerNotificationToken({ fcmToken: token, userAgent: navigator.userAgent });
        setStoredFcmToken(token);
    } catch {
        // 조용히 무시 — 다음 기회에 재시도.
    }
}

export function useEnablePush() {
    return useCallback(() => enablePush(), []);
}
