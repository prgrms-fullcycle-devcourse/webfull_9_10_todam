'use client';

// 인증 상태 관리 스토어.
// - accessToken: 응답 body에서 받아 메모리(zustand)에만 보관(localStorage 미저장).
//   새로고침/재실행 시 소멸 → 부팅 시 /auth/refresh(HttpOnly Refresh Cookie)로 복원(AuthProvider).
//   localStorage 영속화는 XSS 노출 위험이라 제거. Refresh Token은 HttpOnly Cookie라 FE가 직접 다루지 않음.
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
    // 초기엔 항상 미인증. 실제 인증 여부는 부팅 복원(/auth/refresh) 결과로 확정.
    state: 'UNAUTHENTICATED',
    accessToken: null,
    user: null,
    initialized: false,

    setAuth: (accessToken, user) => set({ state: 'AUTHENTICATED', accessToken, user }),

    // 토큰만 먼저 반영(부팅 복원: refresh → setToken → /users/me 호출 시 자동 주입 → setAuth).
    setToken: (accessToken) => set({ state: 'AUTHENTICATED', accessToken }),

    setInitialized: () => set({ initialized: true }),

    clearAuth: () => set({ state: 'UNAUTHENTICATED', accessToken: null, user: null }),
}));

// shared/api/auth-token.ts의 tokenGetter를 authStore와 연결.
// 이 함수를 앱 초기화 시점에 한 번 호출하면 clientApiFetch가 자동으로 토큰을 주입함.
export function connectAuthTokenGetter() {
    setAuthTokenGetter(() => useAuthStore.getState().accessToken);
}
