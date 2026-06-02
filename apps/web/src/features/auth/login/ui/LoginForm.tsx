'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button, TextInput, Logo, Divider } from '@todam/ui';

import { useHeaderOverride } from '../../../../shared/lib/useHeaderOverride';
import { KakaoLoginButton } from './KakaoLoginButton';
import { GoogleLoginButton } from './GoogleLoginButton';

export function LoginForm() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // 전역 Header override: 닫기(X)만 있는 popup 헤더.
    useHeaderOverride({ type: 'popup', onClose: () => router.back() });

    // 이메일/비밀번호가 모두 입력되면 로그인 버튼 활성화(클라이언트 로컬 상태).
    const canSubmit = email.trim().length > 0 && password.trim().length > 0;

    const handleSubmit = () => {
        // TODO(다음 단계): POST /auth/login 연동 (API Contract 참조)
    };

    const handleKakao = () => {
        // TODO(다음 단계): 카카오 OAuth 인가코드 획득 → POST /auth/oauth/kakao
    };

    const handleGoogle = () => {
        // TODO(다음 단계): 구글 OAuth 인가코드 획득 → POST /auth/oauth/google
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

                <div className="flex flex-col gap-4">
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
                            <Link
                                href="/reset-password"
                                className="text-sm font-medium text-foreground-secondary"
                            >
                                비밀번호를 잊으셨나요?
                            </Link>
                        </div>
                    </div>

                    <Button
                        variant="filled"
                        size="lg"
                        className="w-full"
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                    >
                        로그인
                    </Button>
                </div>

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
