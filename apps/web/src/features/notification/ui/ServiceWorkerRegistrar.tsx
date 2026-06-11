'use client';

import { useEffect } from 'react';

/**
 * Phase 1: firebase-messaging-sw.js 생명주기 등록만.
 * FCM getToken / onMessage 호출은 Phase 2에서 추가.
 */
export function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker.register('/firebase-messaging-sw.js').catch((err) => {
            console.error('[SW] 등록 실패:', err);
        });
    }, []);

    return null;
}
