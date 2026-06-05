'use client';

// 카카오 OAuth 콜백 라우트.
// 카카오 인가 서버가 code 쿼리 파라미터와 함께 이 URL로 리다이렉트.
// code를 POST /auth/oauth/kakao 로 전송하고 성공 시 메인으로 이동.
//
// contract:
//   req:  { code: string }
//   res 200: { accessToken, user: { userId, email, nickname, isPartner } }
//   err:  400 INVALID_REQUEST / 500 EXTERNAL_AUTH_SERVER_ERROR

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { InformationIcon } from '@todam/ui';

import { ApiError } from '@/shared/api';
import { useToast } from '@/shared/model';
import { kakaoLogin } from '@/features/auth/login/api';
import { useAuthStore } from '@/features/auth/login/model/authStore';

// 에러 코드별 메시지.
// contract: 400 INVALID_REQUEST / 500 EXTERNAL_AUTH_SERVER_ERROR
const KAKAO_ERROR_MESSAGES: Record<string, string> = {
    INVALID_REQUEST: '카카오 인증에 실패했어요. 다시 시도해 주세요.',
    EXTERNAL_AUTH_SERVER_ERROR:
        '카카오 서버에 일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
};

function getKakaoErrorMessage(err: unknown): string {
    if (err instanceof ApiError) {
        return (
            KAKAO_ERROR_MESSAGES[err.code] ??
            '카카오 로그인 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
        );
    }
    return '카카오 로그인 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.';
}

export default function KakaoOAuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { push } = useToast();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [status, setStatus] = useState<'processing' | 'error'>('processing');

    useEffect(() => {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        // 사용자가 카카오 로그인 취소: 로그인 화면으로 복귀.
        if (error || !code) {
            router.replace('/login');
            return;
        }

        void (async () => {
            try {
                const result = await kakaoLogin(code);
                setAuth(result.accessToken, result.user);
                router.replace('/');
            } catch (err) {
                push({
                    type: 'icon',
                    icon: <InformationIcon />,
                    message: getKakaoErrorMessage(err),
                });
                setStatus('error');
                router.replace('/login');
            }
        })();
    }, [searchParams, router, push, setAuth]);

    if (status === 'error') return null;

    return (
        <div className="flex h-full items-center justify-center bg-background">
            <p className="text-sm text-foreground-secondary">카카오 로그인 처리 중...</p>
        </div>
    );
}
