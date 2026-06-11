'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { useCurrentStudioStore } from '@/entities/studio/model/currentStudio';
import { useAuthStore } from '@/features/auth/login';
import { revokeNotificationToken } from '@/features/notification/api';
import { clearStoredFcmToken, getStoredFcmToken } from '@/features/notification/model/pushToken';

import { logout } from './api';

// 로그아웃 정리 루틴(계정 전환 시 이전 유저 데이터 누수 방지).
// 1) 서버 세션 종료(refresh token/쿠키) 2) auth store(토큰+user) 3) 파트너 컨텍스트
// 4) React Query 캐시 전체(유저 스코프 서버 데이터) 5) 로그인 화면 이동.
// localStorage todam_reserver_info 는 기기 단위 편의값이라 의도적으로 보존.
export function useLogout() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const clearAuth = useAuthStore((s) => s.clearAuth);

    return async (redirectTo = '/login') => {
        // FCM 토큰 revoke (best-effort — 실패해도 로그아웃 진행).
        const fcmToken = getStoredFcmToken();
        if (fcmToken) {
            try {
                await revokeNotificationToken(fcmToken);
            } catch {
                // 무시 — 서버 revoke 실패해도 클라 정리는 계속.
            }
            clearStoredFcmToken();
        }

        try {
            await logout();
        } catch (err) {
            console.warn('[logout] 서버 로그아웃 실패, 클라이언트 상태만 정리', err);
        } finally {
            clearAuth();
            useCurrentStudioStore.setState({ storeId: null, reviewStoreId: null });
            queryClient.clear();
            router.push(redirectTo);
        }
    };
}
