import type { ReactNode } from 'react';

import { RequireAuth } from '@/features/auth/guard';

// `/my` 하위는 모두 로그인 필요 화면. 진입 전 가드로 비로그인 접근을 차단한다(#382-4).
export default function MyLayout({ children }: { children: ReactNode }) {
    return <RequireAuth>{children}</RequireAuth>;
}
