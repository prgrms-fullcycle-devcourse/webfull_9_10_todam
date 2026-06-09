'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, BottomBar, TextInput, InformationIcon } from '@todam/ui';
import { passwordSchema } from '@todam/shared';

import { ApiError } from '@/shared/api';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useToast } from '@/shared/model';
import { resetPassword } from '@/features/auth/reset-password';

// Figma frame 8474:10754: 재설정 링크 진입 페이지.
// 메일의 재설정 링크(/reset-password?email=&code=)로 진입 → 새 비밀번호 1개만 입력.
// BE는 코드 방식이라 링크가 email+code를 URL로 전달, 화면에선 코드 노출/입력 없이 그대로 전송.
// 성공: 로그인 화면 redirect + Toast. 400(코드 불일치/만료): 인라인 "링크 만료/무효" 안내.

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<ResetPasswordLoading />}>
            <ResetPasswordContent />
        </Suspense>
    );
}

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { push } = useToast();

    // 메일 링크가 실어 보내는 값. 화면엔 노출하지 않고 재설정 요청에만 사용.
    const email = searchParams.get('email') ?? '';
    const code = searchParams.get('code') ?? '';
    const linkValid = !!email && !!code;

    const [password, setPassword] = useState('');
    const [pending, setPending] = useState(false);
    const [expiredError, setExpiredError] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const passwordValid = passwordSchema.safeParse(password).success;

    // 전역 Header override: 타이틀 "비밀번호 재설정", 우측 액션 없음.
    useHeaderOverride({ title: '비밀번호 재설정', hideRightAction: true });

    const handleSubmit = async () => {
        if (pending || !passwordValid || !linkValid) return;
        setPending(true);
        setPasswordError(null);
        setExpiredError(false);
        try {
            await resetPassword(email, code, password);
            router.replace('/login');
            push({
                type: 'icon',
                icon: <InformationIcon />,
                message: '비밀번호가 안전하게 변경되었어요',
            });
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.code === 'INVALID_PASSWORD_FORMAT') {
                    setPasswordError('영문, 숫자, 특수문자를 포함해 8~32자로 입력해 주세요.');
                } else {
                    // 코드 불일치/만료/미가입 등 단일 400 → 링크 만료 안내.
                    setExpiredError(true);
                }
            } else {
                push({
                    type: 'icon',
                    icon: <InformationIcon />,
                    message: '비밀번호 재설정 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
                });
            }
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="flex h-full flex-col bg-background">
            <main className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-2">
                {/* 링크 무효/만료 시 인라인 안내 */}
                {(!linkValid || expiredError) && (
                    <div className="rounded-xl bg-danger-subtle px-4 py-3">
                        <p className="text-sm text-danger">
                            {!linkValid
                                ? '재설정 링크가 유효하지 않아요. 다시 비밀번호 재설정을 요청해 주세요.'
                                : '재설정 링크가 만료되었어요. 로그인 화면에서 다시 비밀번호 재설정을 요청해 주세요.'}
                        </p>
                    </div>
                )}

                <TextInput
                    id="reset-new-password"
                    label="비밀번호"
                    type="password"
                    autoComplete="new-password"
                    placeholder="영문, 숫자, 특수기호 포함 8자 이상"
                    value={password}
                    error={!!passwordError}
                    helperText={passwordError ?? undefined}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError(null);
                    }}
                    disabled={!linkValid || expiredError}
                />
            </main>

            <BottomBar>
                <Button
                    variant="filled"
                    size="lg"
                    className="w-full"
                    disabled={!passwordValid || pending || !linkValid || expiredError}
                    onClick={() => void handleSubmit()}
                >
                    재설정 완료
                </Button>
            </BottomBar>
        </div>
    );
}

function ResetPasswordLoading() {
    return (
        <div className="flex h-full items-center justify-center bg-background">
            <p className="text-sm text-foreground-secondary">
                비밀번호 재설정 화면을 불러오는 중...
            </p>
        </div>
    );
}
