'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, TextInput, BottomBar, LeftIcon, InformationIcon } from '@todam/ui';
import { CODE_LENGTH, emailSchema, passwordSchema, verifyCodeSchema } from '@todam/shared';
import { useToast } from '../../../shared/model';

type Step = 'email' | 'code' | 'password';

// UI 타이머(검증 아님) → 로컬 상수 유지. CODE_LENGTH·검증은 @todam/shared
const VERIFY_SECONDS = 300; // 5:00

const STEP_CTA: Record<Step, string> = {
    email: '인증번호 보내기',
    code: '다음',
    password: '완료',
};

function formatTimer(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SignupPage() {
    const router = useRouter();
    const { push } = useToast();

    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [codeError, setCodeError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(VERIFY_SECONDS);

    const emailValid = emailSchema.safeParse(email).success;
    const codeValid = verifyCodeSchema.safeParse(code).success;
    const passwordValid = passwordSchema.safeParse(password).success;

    // 인증번호 단계 타이머
    useEffect(() => {
        if (step !== 'code' || secondsLeft <= 0) return;
        const timer = setInterval(() => setSecondsLeft((prev) => Math.max(0, prev - 1)), 1000);
        return () => clearInterval(timer);
    }, [step, secondsLeft]);

    const handleBack = () => {
        if (step === 'code') setStep('email');
        else if (step === 'password') setStep('code');
        else router.back();
    };

    // TODO: 인증번호 전송 API 연동 (엔드포인트 미제공)
    const sendCode = () => {
        setCode('');
        setCodeError(false);
        setSecondsLeft(VERIFY_SECONDS);
        push({
            type: 'icon',
            icon: <InformationIcon />,
            message: '입력하신 이메일로 인증번호를 전송했어요.',
        });
    };

    const handlePrimary = async () => {
        if (step === 'email') {
            sendCode();
            setStep('code');
            return;
        }

        if (step === 'code') {
            // TODO: 인증번호 확인 API 연동 (엔드포인트 미제공) — 임시로 6자리면 통과
            if (!codeValid) {
                setCodeError(true);
                push({
                    type: 'icon',
                    icon: <InformationIcon />,
                    message: '인증번호가 일치하지 않습니다.',
                });
                return;
            }
            setStep('password');
            return;
        }

        // step === 'password' → 회원가입 요청
        if (!passwordValid) {
            setPasswordError(true);
            return;
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    // TODO: 약관 동의 UI(동의 시트) 디자인 확정 후 실제 동의값 반영
                    termsAgreed: true,
                    privacyAgreed: true,
                }),
            });
            const body = await res.json();
            push({ type: 'icon', icon: <InformationIcon />, message: body.message });
            if (res.status === 409) {
                setStep('email');
            }
            // TODO: 201 시 이메일 인증 단계로 전이
        } catch {
            push({
                type: 'icon',
                icon: <InformationIcon />,
                message: '회원가입 처리 중 오류가 발생했습니다.',
            });
        }
    };

    const primaryDisabled =
        (step === 'email' && !emailValid) ||
        (step === 'code' && !codeValid) ||
        (step === 'password' && !passwordValid);

    return (
        <div className="flex h-full flex-col bg-background">
            <header className="flex h-15 items-center pt-safe">
                <Button
                    variant="ghost"
                    layout="onlyIcon"
                    size="lg"
                    icon={<LeftIcon />}
                    aria-label="뒤로"
                    onClick={handleBack}
                />
                <h1 className="text-lg font-medium text-foreground">회원가입</h1>
            </header>

            <main className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-2">
                {step === 'email' && (
                    <TextInput
                        label="이메일"
                        type="email"
                        inputMode="email"
                        placeholder="leadem@mail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                )}

                {step === 'code' && (
                    <>
                        <TextInput label="이메일" value={email} disabled />
                        <div className="flex flex-col gap-1">
                            <TextInput
                                label="인증번호"
                                inputMode="numeric"
                                maxLength={CODE_LENGTH}
                                placeholder="6자리 숫자 입력"
                                value={code}
                                error={codeError}
                                onChange={(e) => {
                                    setCode(e.target.value.replace(/\D/g, ''));
                                    setCodeError(false);
                                }}
                            />
                            <div className="flex items-center justify-between px-1">
                                <span
                                    className={[
                                        'text-xs',
                                        secondsLeft === 0
                                            ? 'text-danger'
                                            : 'text-foreground-secondary',
                                    ].join(' ')}
                                >
                                    {formatTimer(secondsLeft)}
                                </span>
                                <button
                                    type="button"
                                    onClick={sendCode}
                                    className="cursor-pointer text-xs font-semibold text-foreground-secondary"
                                >
                                    인증번호 재전송
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {step === 'password' && (
                    <TextInput
                        label="비밀번호"
                        type="password"
                        placeholder="영문, 숫자, 특수기호 포함 8자 이상"
                        value={password}
                        error={passwordError}
                        helperText={
                            passwordError ? '영문, 숫자, 특수기호 포함 8자 이상' : undefined
                        }
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setPasswordError(false);
                        }}
                    />
                )}
            </main>

            <BottomBar>
                <Button
                    variant="filled"
                    size="lg"
                    className="w-full"
                    disabled={primaryDisabled}
                    onClick={handlePrimary}
                >
                    {STEP_CTA[step]}
                </Button>
            </BottomBar>
        </div>
    );
}
