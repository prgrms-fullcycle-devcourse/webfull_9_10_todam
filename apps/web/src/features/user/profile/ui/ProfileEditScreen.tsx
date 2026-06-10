'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput, Button } from '@todam/ui';

import { useToast, useModal } from '@/shared/model';
import { ApiError } from '@/shared/api';
import { useMyProfile, useUpdateMyProfile } from '../queries';
import { WithdrawModal } from './WithdrawModal';

// 닉네임 유효성: 공백 제외 2~10자, 특수문자 불가 (정본). D5 정규식 확정 전 기본 검증.
function validateNickname(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length < 2) return '닉네임은 2자 이상 입력해주세요.';
    if (trimmed.length > 10) return '닉네임은 10자 이하로 입력해주세요.';
    // 특수문자 불가 (한글·영문·숫자 허용)
    if (/[^가-힣a-zA-Z0-9]/.test(trimmed)) {
        return '닉네임은 특수문자를 포함할 수 없습니다.';
    }
    return null;
}

export function ProfileEditScreen() {
    const router = useRouter();
    const toast = useToast();
    const { open: openModal } = useModal();

    const { data: profileData, isLoading } = useMyProfile();
    const updateProfile = useUpdateMyProfile();

    const [nickname, setNickname] = useState('');
    const [nicknameError, setNicknameError] = useState<string | null>(null);

    // 초기 닉네임: 프로필 로드 후 한 번만 세팅
    const currentNickname = profileData?.user.nickname ?? '';
    const email = profileData?.user.email ?? '';

    const handleNicknameChange = (value: string) => {
        setNickname(value);
        setNicknameError(null);
    };

    const displayNickname = nickname !== '' ? nickname : currentNickname;

    const handleSave = () => {
        const trimmed = nickname.trim();
        // 변경 없음
        if (trimmed === currentNickname || trimmed === '') {
            toast.push({ message: '변경된 내용이 없습니다.' });
            return;
        }

        const error = validateNickname(trimmed);
        if (error) {
            setNicknameError(error);
            return;
        }

        updateProfile.mutate(
            { nickname: trimmed },
            {
                onSuccess: () => {
                    toast.push({ message: '닉네임이 변경되었습니다.' });
                    router.back();
                },
                onError: (err) => {
                    if (err instanceof ApiError) {
                        if (err.code === 'NICKNAME_ALREADY_EXISTS') {
                            setNicknameError(
                                '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.',
                            );
                        } else if (err.code === 'INVALID_REQUEST') {
                            setNicknameError(
                                '닉네임은 특수문자를 제외한 2자 이상 10자 이내여야 합니다.',
                            );
                        } else {
                            toast.push({
                                message: '저장 중 오류가 발생했습니다. 다시 시도해주세요.',
                            });
                        }
                    } else {
                        toast.push({ message: '저장 중 오류가 발생했습니다. 다시 시도해주세요.' });
                    }
                },
            },
        );
    };

    const handleWithdraw = () => {
        openModal(<WithdrawModal />);
    };

    return (
        <main className="flex flex-1 flex-col overflow-y-auto px-4 pb-8 pt-6">
            <div className="flex flex-1 flex-col gap-6">
                {/* 이메일 — 읽기 전용 */}
                <TextInput
                    id="profile-email"
                    label="이메일"
                    type="email"
                    value={isLoading ? '' : email}
                    readOnly
                    disabled
                    placeholder="로딩 중..."
                />

                {/* 닉네임 */}
                <TextInput
                    id="profile-nickname"
                    label="닉네임"
                    type="text"
                    value={displayNickname}
                    onChange={(e) => handleNicknameChange(e.target.value)}
                    placeholder="닉네임을 입력해주세요"
                    error={!!nicknameError}
                    helperText={nicknameError ?? '특수문자를 제외한 2~10자로 입력해주세요.'}
                    maxLength={10}
                />
            </div>

            {/* 회원탈퇴 진입 — Figma D-1: Divider + 안내문 + 링크 (foreground-tertiary, 12px) */}
            <div className="my-6 flex flex-col items-center gap-1">
                <div className="h-px w-full bg-border-subtle mb-4" />
                <p className="text-xs text-foreground-tertiary">
                    혹시 리듬을 떠나고 싶으신가요?{' '}
                    <button
                        type="button"
                        onClick={handleWithdraw}
                        className="text-xs font-semibold text-foreground-tertiary underline underline-offset-2"
                    >
                        탈퇴하기
                    </button>
                </p>
            </div>

            <Button
                variant="filled"
                size="lg"
                className="w-full"
                onClick={handleSave}
                disabled={updateProfile.isPending || isLoading}
            >
                {updateProfile.isPending ? '저장 중...' : '저장하기'}
            </Button>
        </main>
    );
}
