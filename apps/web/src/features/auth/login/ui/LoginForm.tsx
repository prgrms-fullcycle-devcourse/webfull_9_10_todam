'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button, TextInput, Logo, Divider, InformationIcon } from '@todam/ui';

import { ApiError } from '@/shared/api';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useToast } from '@/shared/model';
import { emailLogin } from '../api';
import { useAuthStore } from '../model/authStore';
import { buildKakaoAuthUrl, buildGoogleAuthUrl } from '../oauth';
import { KakaoLoginButton } from './KakaoLoginButton';
import { GoogleLoginButton } from './GoogleLoginButton';

// 에러 코드별 사용자 피드백 메시지.
// contract: 400 INVALID_REQUEST / 401 UNAUTHORIZED / 403 EMAIL_UNVERIFIED / 500 INTERNAL_SERVER_ERROR
const EMAIL_LOGIN_ERROR_MESSAGES: Record<string, string> = {
    INVALID_REQUEST: '이메일 형식이 올바르지 않거나 필수 항목이 누락됐어요.',
    UNAUTHORIZED: '이메일 또는 비밀번호가 일치하지 않아요.',
    EMAIL_UNVERIFIED: '이메일 인증을 완료한 후 로그인해 주세요.',
    INTERNAL_SERVER_ERROR: '서버에 일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
};

function getEmailLoginErrorMessage(err: unknown): string {
    if (err instanceof ApiError) {
        return (
            EMAIL_LOGIN_ERROR_MESSAGES[err.code] ??
            '로그인 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
        );
    }
    return '로그인 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.';
}

export interface LoginFormProps {
    onForgotPassword: () => void;
    onLoginSuccess?: () => void;
}

export function LoginForm({ onForgotPassword, onLoginSuccess }: LoginFormProps) {
    const router = useRouter();
    const { push } = useToast();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pending, setPending] = useState(false);

    // 전역 Header override: 닫기(X)만 있는 popup 헤더.
    // 닫기 → 홈. 로그아웃 직후 진입 시 직전 화면이 보호 화면이라 back() 하면
    // 다시 로그인으로 튕기는 루프가 생기므로 항상 '/' 로 보낸다.
    useHeaderOverride({ type: 'popup', onClose: () => router.replace('/') });

    // 이메일/비밀번호가 모두 입력되면 로그인 버튼 활성화(클라이언트 로컬 상태).
    const canSubmit = email.trim().length > 0 && password.trim().length > 0;

    // POST /auth/login — 이메일 로그인.
    // 성공: accessToken 보관 + 인증 상태 전이 + 메인 이동.
    // 실패: 에러 코드별 토스트.
    const handleSubmit = async () => {
        if (pending || !canSubmit) return;
        setPending(true);
        try {
            const result = await emailLogin({ email, password });
            setAuth(result.accessToken, result.user);
            router.replace('/');
            onLoginSuccess?.();
        } catch (err) {
            push({
                type: 'icon',
                icon: <InformationIcon />,
                message: getEmailLoginErrorMessage(err),
            });
            // 로그인 실패 시 비밀번호만 초기화(이메일은 사용자가 눈으로 확인 가능하므로 유지).
            setPassword('');
        } finally {
            setPending(false);
        }
    };

    // 카카오 OAuth: 인가코드 획득을 위해 카카오 인가 URL로 리다이렉트.
    // 콜백 라우트(/oauth/kakao)에서 code를 받아 POST /auth/oauth/kakao 전송.
    const handleKakao = () => {
        window.location.href = buildKakaoAuthUrl();
    };

    // 구글 OAuth: 인가코드 획득을 위해 구글 인가 URL로 리다이렉트.
    // 콜백 라우트(/oauth/google)에서 code를 받아 POST /auth/oauth/google 전송.
    const handleGoogle = () => {
        window.location.href = buildGoogleAuthUrl();
    };

    return (
        <div className="flex h-full flex-col bg-background">
            <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-8 pt-2">
                <div className="flex flex-col gap-3">
                    <Logo color="brand" height={40} />
                    <p className="text-lg font-medium leading-6 text-foreground-secondary">
                        손끝에서 완성까지,
                        <br />내 작품의 모든 시간을 함께해요
                    </p>
                </div>

                <form
                    className="flex flex-col gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleSubmit();
                    }}
                >
                    <TextInput
                        id="login-email"
                        label="이메일"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="leadem@mail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <div className="flex flex-col gap-2">
                        <TextInput
                            id="login-password"
                            label="비밀번호"
                            type="password"
                            autoComplete="current-password"
                            placeholder="영문, 숫자, 특수기호 포함 8자 이상"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <button
                                type="button"
                                className="cursor-pointer text-sm font-semibold text-primary"
                                onClick={onForgotPassword}
                            >
                                비밀번호를 잊으셨나요?
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        variant="filled"
                        size="lg"
                        className="w-full"
                        disabled={!canSubmit || pending}
                    >
                        로그인
                    </Button>
                </form>

                <div className="flex items-center gap-3">
                    <Divider className="flex-1" />
                    <span className="shrink-0 text-sm text-foreground-tertiary">
                        다른 방법으로 시작하기
                    </span>
                    <Divider className="flex-1" />
                </div>

                <div className="flex flex-col gap-3">
                    <KakaoLoginButton onClick={handleKakao} />
                    <GoogleLoginButton onClick={handleGoogle} />
                </div>

                <p className="text-center text-sm text-foreground-tertiary">
                    아직 회원이 아닌가요?{' '}
                    <Link href="/signup" className="font-semibold text-foreground-secondary">
                        회원가입
                    </Link>
                </p>
            </main>
        </div>
    );
}
