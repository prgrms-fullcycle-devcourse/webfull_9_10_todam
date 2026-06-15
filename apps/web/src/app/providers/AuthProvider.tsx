'use client';

// clientApiFetch가 authStore의 accessToken을 자동으로 주입하도록
// tokenGetter와 공통 인증 에러 핸들러를 연결하는 앱 초기화 Provider.

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/shared/model';

import { LoginRequiredModal } from '@/features/auth/guard';
import { connectAuthTokenGetter, refreshSession, useAuthStore } from '@/features/auth/login';
import { getMyProfile } from '@/features/user/profile';
import { ApiError, setApiErrorHandler } from '@/shared/api';

const LOGIN_PATH = '/login';
const PARTNER_GUARD_MESSAGE = '파트너 권한이 없습니다.';

let isAuthRedirectPending = false;

function isAuthRedirectError(error: ApiError): boolean {
    if (error.statusCode === 401) return true;
    return (
        error.statusCode === 403 &&
        error.code === 'FORBIDDEN' &&
        error.message === PARTNER_GUARD_MESSAGE
    );
}

function redirectToLogin(): void {
    useAuthStore.getState().clearAuth();
    window.location.replace(LOGIN_PATH);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const { open: openModal, close: closeModal } = useModal();
    const router = useRouter();

    useEffect(() => {
        const goLogin = () => {
            closeModal();
            redirectToLogin();
        };

        // 닫기: 모달 닫고 직전 화면으로 돌아간다(데이터 미렌더 빈 화면 방지, #382-4).
        const dismiss = () => {
            isAuthRedirectPending = false;
            closeModal();
            router.back();
        };

        function handleAuthError(error: ApiError): void {
            if (!isAuthRedirectError(error)) return;
            if (window.location.pathname === LOGIN_PATH) return;

            useAuthStore.getState().clearAuth();

            if (isAuthRedirectPending) return;
            isAuthRedirectPending = true;

            openModal(<LoginRequiredModal onCancel={dismiss} onConfirm={goLogin} />);
        }

        connectAuthTokenGetter();
        setApiErrorHandler(handleAuthError);

        // 부팅 세션 복원(#382-2 PWA 로그인 유지):
        // refresh_token 쿠키가 살아 있으면 새 access token + 프로필을 받아 세션을 복원한다.
        // 실패(비로그인/만료)면 미인증 확정. 어느 쪽이든 initialized 로 RequireAuth 게이트 해제.
        let cancelled = false;
        const { setToken, setAuth, clearAuth, setInitialized } = useAuthStore.getState();

        async function restoreSession() {
            try {
                const { accessToken } = await refreshSession();
                if (cancelled) return;
                setToken(accessToken); // 이후 /users/me 호출에 자동 주입
                // 부팅 복원은 silent — 실패해도 공개 페이지에서 전역 로그인 모달 띄우지 않는다.
                const { user } = await getMyProfile({ skipErrorHandler: true });
                if (cancelled) return;
                setAuth(accessToken, {
                    userId: user.userId,
                    email: user.email,
                    nickname: user.nickname,
                    isPartner: user.isPartner,
                });
            } catch (error) {
                // 401(쿠키 없음/만료)만 미인증 확정. 네트워크/5xx 일시 오류는
                // optimistic 상태를 유지해 유효 세션을 끊지 않는다.
                if (!cancelled && error instanceof ApiError && error.statusCode === 401) {
                    clearAuth();
                }
            } finally {
                if (!cancelled) setInitialized();
            }
        }

        void restoreSession();

        return () => {
            cancelled = true;
        };
    }, [closeModal, openModal, router]);

    return <>{children}</>;
}
