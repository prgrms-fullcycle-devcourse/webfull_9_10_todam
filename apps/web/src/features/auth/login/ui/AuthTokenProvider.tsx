'use client';

// apiFetch가 authStore의 accessToken을 자동으로 주입하도록
// tokenGetter를 연결하는 초기화 컴포넌트.
// 앱 루트(layout.tsx)에서 한 번 렌더하면 됨.

import { useEffect, type ReactNode } from 'react';

import { connectAuthTokenGetter } from '../model/authStore';

export function AuthTokenProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        connectAuthTokenGetter();
    }, []);

    return <>{children}</>;
}
