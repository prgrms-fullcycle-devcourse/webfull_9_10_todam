'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateMyProfileBody, WithdrawBody } from '@todam/shared';
import { useRouter } from 'next/navigation';

import { useToast } from '@/shared/model';
import { ApiError } from '@/shared/api';
import { getMyProfile, updateMyProfile, withdrawAccount } from './api';

export const MY_PROFILE_QUERY_KEY = ['users', 'me'] as const;

// GET /users/me
export function useMyProfile() {
    return useQuery({
        queryKey: MY_PROFILE_QUERY_KEY,
        queryFn: getMyProfile,
    });
}

// PATCH /users/me — 성공 시 프로필 캐시 invalidate
export function useUpdateMyProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: UpdateMyProfileBody) => updateMyProfile(body),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: MY_PROFILE_QUERY_KEY });
        },
    });
}

// DELETE /users/me — 회원탈퇴
// contract: docs/exec-plans/active/마이 - 회원탈퇴.md
// 성공: accessToken 제거 → '/' 이동 → 완료 토스트
// 에러: WithdrawErrorCode에 따라 토스트 메시지 분기
export function useWithdraw() {
    const router = useRouter();
    const toast = useToast();

    return useMutation({
        mutationFn: (body?: WithdrawBody) => withdrawAccount(body),
        onSuccess: () => {
            window.localStorage.removeItem('accessToken');
            toast.push({ message: '회원 탈퇴가 정상적으로 처리되었습니다.' });
            router.push('/');
        },
        onError: (err) => {
            if (err instanceof ApiError) {
                switch (err.code) {
                    case 'ACTIVE_PARTNER_EXISTS':
                        toast.push({ message: '파트너 해지 후 탈퇴가 가능합니다.' });
                        break;
                    case 'ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST':
                        toast.push({
                            message:
                                '진행 중인 클래스 예약 또는 제작 중인 도자기 작품이 남아있어 탈퇴가 불가능합니다.',
                        });
                        break;
                    case 'PASSWORD_MISMATCH':
                        toast.push({
                            message: '본인 확인을 위한 인증 정보가 일치하지 않습니다.',
                        });
                        break;
                    case 'UNAUTHORIZED':
                        toast.push({
                            message: '인증 정보가 유효하지 않거나 만료되었습니다.',
                        });
                        break;
                    case 'USER_NOT_FOUND':
                        toast.push({ message: '존재하지 않거나 탈퇴 처리된 회원입니다.' });
                        break;
                    default:
                        toast.push({ message: '회원 탈퇴 처리 중 서버 내부 오류가 발생했습니다.' });
                }
            } else {
                toast.push({
                    message: '회원 탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
                });
            }
        },
    });
}
