'use client';

import { useEffect, useState } from 'react';

// SSR 안전 마운트 플래그. 첫 렌더(서버 + 클라 첫 패스)는 false 반환 → 서버 HTML과 일치,
// 마운트 후 effect에서 true로 전환. localStorage 기반 상태(authStore 등)로 분기하는 컴포넌트의
// hydration mismatch 회피용.
export function useHasMounted(): boolean {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}
