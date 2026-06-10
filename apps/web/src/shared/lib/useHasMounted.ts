'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

// SSR 안전 마운트 플래그. 서버 + 클라 첫(hydration) 렌더는 false → 서버 HTML과 일치,
// hydration 커밋 후 true. localStorage 기반 상태(authStore 등)로 분기하는 컴포넌트의
// hydration mismatch 회피용. setState-in-effect 없이 useSyncExternalStore로 구현.
export function useHasMounted(): boolean {
    return useSyncExternalStore(
        emptySubscribe,
        () => true, // client snapshot
        () => false, // server snapshot
    );
}
