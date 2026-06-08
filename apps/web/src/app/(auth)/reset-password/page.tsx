'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, BottomBar, TextInput, InformationIcon } from '@todam/ui';
import { passwordSchema } from '@todam/shared';

import { ApiError } from '@/shared/api';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useToast } from '@/shared/model';
import { resetPassword } from '@/features/auth/reset-password';

// Figma frame 8474:10754: 재설정 확정 페이지.
// 비밀번호 TextInput 1개 (confirm 필드 없음 — Figma 정본 기준).
// Fixed-bottom "재설정 완료" 버튼. 비밀번호 유효 시 활성화.
// 성공: 로그인 화면 redirect + Toast "비밀번호가 안전하게 변경되었어요".
// 401 INVALID_OR_EXPIRED_TOKEN: 인라인 "링크 만료" 안내.

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

    const token = searchParams.get('token') ?? '';

    const [password, setPassword] = useState('');
    const [pending, setPending] = useState(false);
    const [expiredError, setExpiredError] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const passwordValid = passwordSchema.safeParse(password).success;

    // 전역 Header override: sub 타입, 타이틀 "비밀번호 재설정" (Figma frame 8474:10754 header).
    useHeaderOverride({ title: '비밀번호 재설정', hideRightAction: true });

    const handleSubmit = async () => {
        if (pending || !passwordValid || !token) return;
        setPending(true);
        setPasswordError(null);
        setExpiredError(false);
        try {
            await resetPassword(token, password);
            // Figma frame 8474:10302: 성공 후 로그인 화면 + Toast (type=icon, dark bg).
            router.replace('/login');
            push({
                type: 'icon',
                icon: <InformationIcon />,
                message: '비밀번호가 안전하게 변경되었어요',
            });
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.code === 'INVALID_OR_EXPIRED_TOKEN') {
                    // 401: 링크 만료 — 인라인 안내
                    setExpiredError(true);
                } else if (err.code === 'PASSWORD_ALREADY_USED') {
                    setPasswordError(
                        '기존에 사용하던 비밀번호와 동일한 비밀번호로는 변경할 수 없어요.',
                    );
                } else if (err.code === 'INVALID_PASSWORD_FORMAT') {
                    setPasswordError('영문, 숫자, 특수문자를 포함해 8~32자로 입력해 주세요.');
                } else {
                    push({
                        type: 'icon',
                        icon: <InformationIcon />,
                        message: err.message,
                    });
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
                {/* 토큰 없거나 링크 만료 시 인라인 안내 */}
                {(!token || expiredError) && (
                    <div className="rounded-xl bg-danger-subtle px-4 py-3">
                        <p className="text-sm text-danger">
                            {!token
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
                    disabled={!token || expiredError}
                />
            </main>

            {/* Figma: fixed-bottom ButtonSection — white bg, top border, padding-top 16, padding-bottom 28 */}
            <BottomBar>
                <Button
                    variant="filled"
                    size="lg"
                    className="w-full"
                    disabled={!passwordValid || pending || !token || expiredError}
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
