'use client';

// 로그인 필요 화면 가드(#382-4) — 직접 URL 진입/딥링크용 fallback.
// (BottomNav 등 앱 내 탭 이동은 useLoginRequiredGuard 가 클릭 시점에 진입 자체를 막는다.)
// 비로그인으로 보호 화면에 직접 진입하면 보호 콘텐츠를 렌더하지 않고 모달을 띄운다.
//   - 닫기  → 홈('/')으로(직전이 또 보호 화면일 수 있어 back() 대신 '/').
//   - 로그인 → /login.
// 부팅 세션 복원(AuthProvider) 이 끝나기 전(initialized=false)에는 판단을 보류(깜빡임 방지).

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/features/auth/login';
import { useModal } from '@/shared/model';

import { LoginRequiredModal } from './LoginRequiredModal';

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
        // 닫기: 홈으로 이동. 보호 화면 직접 진입/로그아웃 직후라 직전 화면이
        // 또 다른 보호 화면일 수 있어 back() 대신 항상 '/' 로 보낸다.
        const dismiss = () => {
            close();
            router.replace('/');
        };

        open(<LoginRequiredModal onCancel={dismiss} onConfirm={goLogin} />);

        return () => close();
    }, [blocked, open, close, router]);

    // 미인증/복원중에는 보호 콘텐츠를 렌더하지 않는다(진입 전 모달 + 빈 화면 방지).
    if (!isAuthenticated) return null;

    return <>{children}</>;
}
