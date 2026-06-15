'use client';

// 인증 상태 관리 스토어.
// - accessToken: 응답 body에서 받아 메모리(zustand) + localStorage(stopgap)에 보관.
//   Refresh Token은 HttpOnly Secure Cookie이므로 FE에서 직접 다루지 않음.
// - shared/api/auth-token.ts 의 tokenGetter를 이 스토어와 연결해 clientApiFetch에 자동 주입.

import { create } from 'zustand';

import { setAuthTokenGetter } from '@/shared/api';
import type { LoginUser } from '../api';

type AuthState = 'UNAUTHENTICATED' | 'AUTHENTICATED';

type AuthStore = {
    state: AuthState;
    accessToken: string | null;
    user: LoginUser | null;
    // 부팅 세션 복원(/auth/refresh) 완료 여부. RequireAuth 가 복원 끝나기 전 모달 깜빡임을 막는 데 사용.
    initialized: boolean;
    setAuth: (accessToken: string, user: LoginUser) => void;
    setToken: (accessToken: string) => void;
    setInitialized: () => void;
    clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
    // 페이지 로드 시 localStorage fallback(stopgap). auth 연동 후 setAuth가 덮어씀.
    state:
        typeof window !== 'undefined' && window.localStorage.getItem('accessToken')
            ? 'AUTHENTICATED'
            : 'UNAUTHENTICATED',
    accessToken: typeof window !== 'undefined' ? window.localStorage.getItem('accessToken') : null,
    user: null,
    initialized: false,

    setAuth: (accessToken, user) => {
        // localStorage에 저장: 페이지 새로고침 후에도 인증 유지(stopgap).
        // 보안: 실제 운영 환경에서는 메모리만 사용하고 토큰 갱신은 /auth/refresh로 처리.
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('accessToken', accessToken);
        }
        set({ state: 'AUTHENTICATED', accessToken, user });
    },

    // 토큰만 먼저 반영(부팅 복원: refresh → setToken → /users/me 호출 시 자동 주입 → setAuth).
    setToken: (accessToken) => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('accessToken', accessToken);
        }
        set({ state: 'AUTHENTICATED', accessToken });
    },

    setInitialized: () => set({ initialized: true }),

    clearAuth: () => {
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem('accessToken');
        }
        set({ state: 'UNAUTHENTICATED', accessToken: null, user: null });
    },
}));

// shared/api/auth-token.ts의 tokenGetter를 authStore와 연결.
// 이 함수를 앱 초기화 시점에 한 번 호출하면 clientApiFetch가 자동으로 토큰을 주입함.
export function connectAuthTokenGetter() {
    setAuthTokenGetter(() => useAuthStore.getState().accessToken);
}
