'use client';

// clientApiFetch가 authStore의 accessToken을 자동으로 주입하도록
// tokenGetter와 공통 인증 에러 핸들러를 연결하는 앱 초기화 Provider.

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@todam/ui';
import { useModal } from '@/shared/model';

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

            openModal(
                <Modal
                    type="shortText"
                    title="로그인이 필요해요"
                    description="로그인 후 다시 이용해 주세요."
                    cancelLabel="닫기"
                    confirmLabel="로그인하기"
                    onCancel={dismiss}
                    onConfirm={goLogin}
                />,
            );
        }

        connectAuthTokenGetter();
        setApiErrorHandler(handleAuthError);

        // 부팅 세션 복원(#382-2 PWA 로그인 유지):
        // refresh_token 쿠키가 살아 있으면 새 access token + 프로필을 받아 세션을 복원한다.
        // 실패(비로그인/만료)면 미인증 확정. 어느 쪽이든 initialized 로 RequireAuth 게이트 해제.
        let cancelled = false;
        const { setToken, setAuth, clearAuth, setInitialized } = useAuthStore.getState();

        // dev 전용 주입 토큰(QR 디바이스 테스트, /dev-login). prod 에선 항상 null.
        // 토큰을 localStorage 에 영속하지 않으므로 dev 주입분만 부팅 시 1회 메모리로 끌어온다.
        const devSeedToken =
            process.env.NODE_ENV !== 'production' && typeof window !== 'undefined'
                ? window.localStorage.getItem('accessToken')
                : null;
        // 1회성: 메모리로 끌어온 뒤 제거(이후 새로고침은 refresh 복원, dev 로그아웃 후 좀비 로그인 방지).
        if (devSeedToken) window.localStorage.removeItem('accessToken');

        async function restoreSession() {
            try {
                // dev 주입 토큰이 있으면 refresh 생략, 없으면 refresh 쿠키로 재발급.
                const accessToken = devSeedToken ?? (await refreshSession()).accessToken;
                if (cancelled) return;
                setToken(accessToken); // 이후 /users/me 호출에 자동 주입
                const { user } = await getMyProfile();
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
