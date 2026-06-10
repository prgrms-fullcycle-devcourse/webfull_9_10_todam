'use client';

// clientApiFetch가 authStore의 accessToken을 자동으로 주입하도록
// tokenGetter와 공통 인증 에러 핸들러를 연결하는 앱 초기화 Provider.

import { useEffect, type ReactNode } from 'react';
import { Modal } from '@todam/ui';
import { useModal } from '@/shared/model';

import { connectAuthTokenGetter } from '@/features/auth/login';
import { setApiErrorHandler, type ApiError } from '@/shared/api';

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
    window.localStorage.removeItem('accessToken');
    window.location.replace(LOGIN_PATH);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const { open: openModal, close: closeModal } = useModal();

    useEffect(() => {
        const goLogin = () => {
            closeModal();
            redirectToLogin();
        };

        // 닫기: 모달만 닫고 머문다. pending 리셋해 다음 401에 다시 안내.
        const dismiss = () => {
            isAuthRedirectPending = false;
            closeModal();
        };

        function handleAuthError(error: ApiError): void {
            if (!isAuthRedirectError(error)) return;
            if (window.location.pathname === LOGIN_PATH) return;

            window.localStorage.removeItem('accessToken');

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
    }, [closeModal, openModal]);

    return <>{children}</>;
}
