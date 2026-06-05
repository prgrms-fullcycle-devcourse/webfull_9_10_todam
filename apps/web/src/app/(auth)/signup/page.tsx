'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, TextInput, BottomBar, InformationIcon } from '@todam/ui';
import { CODE_LENGTH, emailSchema, passwordSchema, verifyCodeSchema } from '@todam/shared';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useToast, useSheet } from '@/shared/model';
import { ApiError } from '@/shared/api';
import { sendEmailCode, verifyEmailCode, signup } from '@/features/auth/signup/api';
import { TermsAgreementSheet } from '@/features/auth/terms';

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
    const { open: openSheet, close: closeSheet } = useSheet();

    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [codeError, setCodeError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(VERIFY_SECONDS);
    const [pending, setPending] = useState(false);

    const emailValid = emailSchema.safeParse(email).success;
    const codeValid = verifyCodeSchema.safeParse(code).success;
    const passwordValid = passwordSchema.safeParse(password).success;

    // 회원가입 진입 시 약관 동의 게이트. 동의값은 BE SignupDto 미수용(forbidNonWhitelisted)
    // → 전송 안 하고 FE 진행 게이트로만 사용. 필수 미동의 닫기 시 로그인으로 복귀.
    useEffect(() => {
        openSheet(
            <TermsAgreementSheet
                onConfirm={closeSheet}
                onClose={() => {
                    closeSheet();
                    router.back();
                }}
            />,
        );
        // 마운트 시 1회만.
    }, []);

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

    const toast = (message: string) => push({ type: 'icon', icon: <InformationIcon />, message });

    const errMessage = (err: unknown, fallback: string) =>
        err instanceof ApiError ? err.message : fallback;

    const sendCode = async (): Promise<boolean> => {
        try {
            await sendEmailCode(email);
            setCode('');
            setCodeError(false);
            setSecondsLeft(VERIFY_SECONDS);
            toast('입력하신 이메일로 인증번호를 전송했어요.');
            return true;
        } catch (err) {
            toast(errMessage(err, '인증번호 전송 중 오류가 발생했습니다.'));
            return false;
        }
    };

    const handlePrimary = async () => {
        if (pending) return;
        setPending(true);
        try {
            if (step === 'email') {
                if (await sendCode()) setStep('code');
                return;
            }

            if (step === 'code') {
                if (!codeValid) {
                    setCodeError(true);
                    toast('인증번호가 일치하지 않습니다.');
                    return;
                }
                try {
                    await verifyEmailCode(email, code);
                    setStep('password');
                } catch (err) {
                    setCodeError(true);
                    toast(errMessage(err, '인증번호 확인 중 오류가 발생했습니다.'));
                }
                return;
            }

            // step === 'password' → 회원가입 요청
            if (!passwordValid) {
                setPasswordError(true);
                return;
            }
            try {
                await signup({ email, password });
                toast('회원가입이 완료되었습니다. 로그인해주세요.');
                router.replace('/login');
            } catch (err) {
                if (err instanceof ApiError && err.statusCode === 409) {
                    toast(err.message);
                    setStep('email');
                    return;
                }
                toast(errMessage(err, '회원가입 처리 중 오류가 발생했습니다.'));
            }
        } finally {
            setPending(false);
        }
    };

    const primaryDisabled =
        pending ||
        (step === 'email' && !emailValid) ||
        (step === 'code' && !codeValid) ||
        (step === 'password' && !passwordValid);

    // 전역 Header override: 뒤로가기(단계 역행/이탈) + 타이틀. 우측 액션 없음.
    useHeaderOverride({ title: '회원가입', onBack: handleBack, hideRightAction: true });

    return (
        <div className="flex h-full flex-col bg-background">
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
                                    onClick={() => void sendCode()}
                                    disabled={pending}
                                    className="text-xs font-semibold text-foreground-secondary disabled:opacity-50"
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
