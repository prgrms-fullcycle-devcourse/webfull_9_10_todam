'use client';

// 로그인 필요 화면 가드(#382-4).
// 비로그인 상태로 보호 화면 접근 시 화면 "진입 전" 로그인 모달을 띄우고 보호 콘텐츠는 렌더하지 않는다.
//   - 닫기  → router.back() 으로 직전 화면 복귀(데이터 미렌더 빈 화면 방지).
//   - 로그인 → /login 이동.
// 부팅 세션 복원(AuthProvider) 이 끝나기 전(initialized=false)에는 판단을 보류해 모달 깜빡임을 막는다.
//   localStorage stopgap 으로 optimistic AUTHENTICATED 면 즉시 통과.

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@todam/ui';

import { useAuthStore } from '@/features/auth/login';
import { useModal } from '@/shared/model';

export function RequireAuth({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { open, close } = useModal();
    const isAuthenticated = useAuthStore((s) => s.state === 'AUTHENTICATED');
    const initialized = useAuthStore((s) => s.initialized);

    // 복원 완료 후에도 미인증이면 차단. 복원 중엔 보류(optimistic 상태 신뢰).
    const blocked = initialized && !isAuthenticated;

    useEffect(() => {
        if (!blocked) return;

        const goLogin = () => {
            close();
            router.replace('/login');
        };
        const dismiss = () => {
            close();
            router.back();
        };

        open(
            <Modal
                type="shortText"
                title="로그인이 필요해요"
                description="로그인 후 다시 이용해 주세요."
                cancelLabel="닫기"
                confirmLabel="로그인하기"
                onCancel={dismiss}
                onConfirm={goLogin}
            />,
        );

        return () => close();
    }, [blocked, open, close, router]);

    // 미인증/복원중에는 보호 콘텐츠를 렌더하지 않는다(진입 전 모달 + 빈 화면 방지).
    if (!isAuthenticated) return null;

    return <>{children}</>;
}
