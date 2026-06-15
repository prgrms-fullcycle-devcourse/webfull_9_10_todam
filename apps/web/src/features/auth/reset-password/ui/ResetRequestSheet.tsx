'use client';

import { useEffect, useRef, useState } from 'react';

import { FormBottomSheet, TextInput, InformationIcon } from '@todam/ui';
import { emailSchema, formatMmSs } from '@todam/shared';

import { ApiError } from '@/shared/api';
import { useSheet, useToast } from '@/shared/model';
import { requestPasswordReset } from '../api';

// 재전송 쿨다운: FE 로컬 타이머 전용 (API Contract 변경 없음, 429 없음).
// 링크 방식: 메일의 재설정 링크 클릭 → /reset-password?email=&code= 진입(별도 페이지).
const RESEND_COOLDOWN_SECONDS = 180;

export type ResetRequestSheetProps = {
    onClose?: () => void;
    /**
     * 로그인 상태(개인정보 수정 등)에서 진입 시 가입 이메일을 프리필한다.
     * 제공되면 이메일 입력칸을 고정(읽기 전용)하고 안내 문구를 재설정 맥락으로 전환한다.
     */
    initialEmail?: string;
};

export function ResetRequestSheet({ onClose, initialEmail }: ResetRequestSheetProps) {
    const { close } = useSheet();
    const { push } = useToast();

    const [email, setEmail] = useState(initialEmail ?? '');
    // 프리필된 경우 = 로그인 상태 진입 → 이메일 고정 + 문구 전환.
    const prefilled = initialEmail != null && initialEmail !== '';
    const [pending, setPending] = useState(false);
    // sent: 전송 완료 후 "링크 전송 완료" 상태
    const [sent, setSent] = useState(false);
    // cooldown: 남은 쿨다운 초 (0이면 재전송 가능)
    const [cooldown, setCooldown] = useState(0);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startCooldown = () => {
        setCooldown(RESEND_COOLDOWN_SECONDS);
    };

    useEffect(() => {
        if (cooldown <= 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }
        if (!intervalRef.current) {
            intervalRef.current = setInterval(() => {
                setCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current!);
                        intervalRef.current = null;
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [cooldown]);

    const emailValid = emailSchema.safeParse(email).success;

    const handleDismiss = () => {
        close();
        onClose?.();
    };

    const handleSend = async () => {
        if (pending || !emailValid) return;
        setPending(true);
        try {
            await requestPasswordReset(email);
            setSent(true);
            startCooldown();
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : '메일 전송 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.';
            push({ type: 'icon', icon: <InformationIcon />, message });
        } finally {
            setPending(false);
        }
    };

    const handleResend = async () => {
        if (pending || cooldown > 0) return;
        setPending(true);
        try {
            await requestPasswordReset(email);
            startCooldown();
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : '메일 전송 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.';
            push({ type: 'icon', icon: <InformationIcon />, message });
        } finally {
            setPending(false);
        }
    };

    // ── 링크 전송 전 상태 ──
    // Figma frame 8474:12017: "비밀번호를 잊으셨나요?", "가입하신 이메일 주소를 입력해 주세요."
    if (!sent) {
        return (
            <FormBottomSheet
                title={prefilled ? '비밀번호를 재설정할까요?' : '비밀번호를 잊으셨나요?'}
                subTitle={
                    prefilled
                        ? '가입하신 이메일로 재설정 링크를 보내드려요.'
                        : '가입하신 이메일 주소를 입력해 주세요.'
                }
                actionLabel="재설정 링크 보내기"
                actionDisabled={!emailValid || pending}
                onAction={() => void handleSend()}
                subLabel="취소"
                onSub={handleDismiss}
            >
                <TextInput
                    id="reset-email"
                    label="이메일"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="todam@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={prefilled}
                    disabled={prefilled}
                />
            </FormBottomSheet>
        );
    }

    // ── 링크 전송 완료 상태 ──
    // Figma frame 8474:10549: "메일함을 확인해 주세요", 이메일 disabled, 재전송 쿨다운 버튼
    const canResend = cooldown === 0 && !pending;
    const primaryLabel =
        cooldown > 0 ? `재전송 까지 ${formatMmSs(cooldown)}` : '재설정 링크 재전송';

    return (
        <FormBottomSheet
            title="메일함을 확인해 주세요"
            subTitle="입력하신 이메일로 링크를 전송했어요."
            actionLabel={primaryLabel}
            actionDisabled={!canResend}
            onAction={() => void handleResend()}
            subLabel="취소"
            onSub={handleDismiss}
        >
            <TextInput id="reset-email-sent" label="이메일" type="email" value={email} disabled />
        </FormBottomSheet>
    );
}
