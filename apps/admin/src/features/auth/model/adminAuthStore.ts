import type { AdminInfo } from '@todam/shared';
import { create } from 'zustand';

import { setAuthTokenGetter } from '@/shared/api';

const TOKEN_KEY = 'admin_accessToken';

type AuthState = 'UNAUTHENTICATED' | 'AUTHENTICATED';

type AdminAuthStore = {
    state: AuthState;
    accessToken: string | null;
    admin: AdminInfo | null;
    setAuth: (accessToken: string, admin: AdminInfo) => void;
    clearAuth: () => void;
};

// 어드민은 refresh token 미발급(plan Open decision 5) → accessToken만 보관.
// 새로고침 유지를 위해 localStorage stopgap 사용.
export const useAdminAuthStore = create<AdminAuthStore>((set) => ({
    state:
        typeof window !== 'undefined' && window.localStorage.getItem(TOKEN_KEY)
            ? 'AUTHENTICATED'
            : 'UNAUTHENTICATED',
    accessToken: typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null,
    admin: null,

    setAuth: (accessToken, admin) => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(TOKEN_KEY, accessToken);
        }
        set({ state: 'AUTHENTICATED', accessToken, admin });
    },

    clearAuth: () => {
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(TOKEN_KEY);
        }
        set({ state: 'UNAUTHENTICATED', accessToken: null, admin: null });
    },
}));

// shared/api auth-token getter를 스토어와 연결(앱 초기화 시 1회 호출).
export function connectAdminAuthTokenGetter() {
    setAuthTokenGetter(() => useAdminAuthStore.getState().accessToken);
}
