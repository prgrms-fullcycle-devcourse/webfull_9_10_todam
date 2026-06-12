'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onMessage } from 'firebase/messaging';
import { NotiIcon } from '@todam/ui';

import { useToast } from '@/shared/model/toast';

import { getMessagingIfSupported } from '../model/firebase';
import { silentReregisterPush } from '../model/usePush';

/**
 * 포그라운드(앱 열려있을 때) FCM 메시지 → 토스트로 표시.
 * 백그라운드 알림은 SW(firebase-messaging-sw.js)가 처리하므로 여기선 포그라운드만.
 * 추가로 마운트 시 권한 허용 상태면 토큰 silent 재등록(로테이션 대비).
 * 화면 출력 없음 — return null.
 */
export function PushMessageListener() {
    const { push } = useToast();
    const router = useRouter();

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        (async () => {
            const messaging = await getMessagingIfSupported();
            if (!messaging) return;

            await silentReregisterPush();

            unsubscribe = onMessage(messaging, (payload) => {
                const message = payload.notification?.title ?? payload.data?.title ?? '새 알림';
                push({
                    type: 'button',
                    message,
                    icon: <NotiIcon />,
                    actionLabel: '바로가기',
                    onAction: () => router.push('/notifications'),
                    duration: 5000,
                });
            });
        })();

        return () => unsubscribe?.();
    }, [push, router]);

    return null;
}
