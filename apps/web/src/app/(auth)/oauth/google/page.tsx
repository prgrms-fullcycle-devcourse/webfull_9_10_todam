'use client';

// 구글 OAuth 콜백 라우트.
// 구글 인가 서버가 code 쿼리 파라미터와 함께 이 URL로 리다이렉트.
// code를 POST /auth/oauth/google 로 전송하고 성공 시 메인으로 이동.
//
// contract:
//   req:  { code: string }
//   res 200: { accessToken, user: { userId, email, nickname, isPartner } }
//   err:  400 INVALID_REQUEST / 403 GOOGLE_EMAIL_UNVERIFIED / 500 EXTERNAL_AUTH_SERVER_ERROR

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { InformationIcon } from '@todam/ui';

import { ApiError } from '@/shared/api';
import { useToast } from '@/shared/model';
import { googleLogin } from '@/features/auth/login/api';
import { useAuthStore } from '@/features/auth/login/model/authStore';

// 에러 코드별 메시지.
// contract: 400 INVALID_REQUEST / 403 GOOGLE_EMAIL_UNVERIFIED / 500 EXTERNAL_AUTH_SERVER_ERROR
const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
    INVALID_REQUEST: '구글 인증에 실패했어요. 다시 시도해 주세요.',
    GOOGLE_EMAIL_UNVERIFIED: '구글 계정의 이메일 인증이 완료되지 않아 로그인할 수 없어요.',
    EXTERNAL_AUTH_SERVER_ERROR:
        '구글 서버에 일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
};

function getGoogleErrorMessage(err: unknown): string {
    if (err instanceof ApiError) {
        return (
            GOOGLE_ERROR_MESSAGES[err.code] ??
            '구글 로그인 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
        );
    }
    return '구글 로그인 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.';
}

export default function GoogleOAuthCallbackPage() {
    return (
        <Suspense fallback={<OAuthLoadingMessage provider="구글" />}>
            <GoogleOAuthCallbackContent />
        </Suspense>
    );
}

function GoogleOAuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { push } = useToast();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [status, setStatus] = useState<'processing' | 'error'>('processing');

    useEffect(() => {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        // 사용자가 구글 로그인 취소: 로그인 화면으로 복귀.
        if (error || !code) {
            router.replace('/login');
            return;
        }

        void (async () => {
            try {
                const result = await googleLogin(code);
                setAuth(result.accessToken, result.user);
                router.replace('/');
            } catch (err) {
                push({
                    type: 'icon',
                    icon: <InformationIcon />,
                    message: getGoogleErrorMessage(err),
                });
                setStatus('error');
                router.replace('/login');
            }
        })();
    }, [searchParams, router, push, setAuth]);

    if (status === 'error') return null;

    return <OAuthLoadingMessage provider="구글" />;
}

function OAuthLoadingMessage({ provider }: { provider: string }) {
    return (
        <div className="flex h-full items-center justify-center bg-background">
            <p className="text-sm text-foreground-secondary">{provider} 로그인 처리 중...</p>
        </div>
    );
}
