'use client';

import { useState } from 'react';
import { Modal, TextInput } from '@todam/ui';

import { useModal } from '@/shared/model';
import { useWithdraw } from '../queries';

// 탈퇴 확인 모달 — plan: docs/exec-plans/active/마이 - 회원탈퇴.md
// Figma: 8505:19302/19303
// 이메일 유저: 비밀번호 입력 후 탈퇴 요청
// 소셜 유저: 비밀번호 입력 없이(빈 채로) 탈퇴 요청 — BE에서 password=null 유저는 검증 생략(D-2)
//
// FE에서 이메일/소셜 구분 필드(hasPassword 등)가 GET /users/me 응답에 없으므로
// 비밀번호 입력란을 항상 노출하되 optional 처리.
// 빈 채로 제출 → body 없이 DELETE → 소셜 유저는 BE 통과, 이메일 유저는 PASSWORD_MISMATCH 400.
export function WithdrawModal() {
    const { close: closeModal } = useModal();
    const withdraw = useWithdraw();
    const [password, setPassword] = useState('');

    const handleConfirm = () => {
        const body = password.trim() ? { password: password.trim() } : undefined;
        withdraw.mutate(body, {
            onSuccess: () => {
                closeModal();
            },
            onError: () => {
                // 에러 토스트는 useWithdraw onError에서 처리
                // PASSWORD_MISMATCH의 경우 모달을 유지해 재입력 기회 제공
            },
        });
    };

    const handleCancel = () => {
        closeModal();
    };

    return (
        <Modal
            type="shortText"
            title="정말 탈퇴하시겠어요?"
            description={
                <div className="flex flex-col gap-3">
                    <span>지금까지 기록한 소중한 작품들이 모두 사라져요.</span>
                    <TextInput
                        id="withdraw-password"
                        label="비밀번호"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호를 입력해주세요 (소셜 로그인은 생략)"
                        autoComplete="current-password"
                    />
                </div>
            }
            cancelLabel="다음에 하기"
            confirmLabel="탈퇴하기"
            danger
            onCancel={handleCancel}
            onConfirm={handleConfirm}
        />
    );
}
