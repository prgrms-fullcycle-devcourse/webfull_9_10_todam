'use client';

import { useEffect } from 'react';
import { onMessage } from 'firebase/messaging';

import { getMessagingIfSupported } from '../model/firebase';
import { silentReregisterPush } from '../model/usePush';

/**
 * 포그라운드(앱 열려있을 때) FCM 메시지 → 시스템 푸시 알림으로 표시.
 * 백그라운드는 notification 페이로드를 브라우저가 자동 표시(SW는 클릭만 처리).
 * 포그라운드는 자동 표시되지 않으므로 SW registration.showNotification으로 직접 띄운다.
 * 클릭 이동은 SW notificationclick이 data.deepLink로 처리.
 * 추가로 마운트 시 권한 허용 상태면 토큰 silent 재등록(로테이션 대비).
 * 화면 출력 없음 — return null.
 */
export function PushMessageListener() {
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        (async () => {
            const messaging = await getMessagingIfSupported();
            if (!messaging) return;

            await silentReregisterPush();

            unsubscribe = onMessage(messaging, (payload) => {
                void (async () => {
                    if (Notification.permission !== 'granted') return;
                    const registration = await navigator.serviceWorker.ready;
                    const title = payload.notification?.title ?? payload.data?.title ?? '새 알림';
                    await registration.showNotification(title, {
                        body: payload.notification?.body ?? payload.data?.body ?? '',
                        icon: '/icons/icon-192x192.png',
                        badge: '/icons/icon-192x192.png',
                        data: { deepLink: payload.data?.deepLink ?? '/notifications' },
                    });
                })();
            });
        })();

        return () => unsubscribe?.();
    }, []);

    return null;
}
