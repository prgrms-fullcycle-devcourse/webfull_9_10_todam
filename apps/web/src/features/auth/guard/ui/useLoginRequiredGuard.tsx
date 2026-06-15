'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/features/auth/login';
import { useModal } from '@/shared/model';

import { LoginRequiredModal } from './LoginRequiredModal';

// 로그인 필요 경로로의 "네비게이션 전" 가로채기
// 반환 함수가 true 면 호출부에서 e.preventDefault() 로 진입을 막아야 함
export function useLoginRequiredGuard(): () => boolean {
    const router = useRouter();
    const { open, close } = useModal();
    const state = useAuthStore((s) => s.state);
    const initialized = useAuthStore((s) => s.initialized);

    return useCallback(() => {
        if (state === 'AUTHENTICATED' || !initialized) return false;

        open(
            <LoginRequiredModal
                onCancel={close}
                onConfirm={() => {
                    close();
                    router.push('/login');
                }}
            />,
        );
        return true;
    }, [state, initialized, open, close, router]);
}
