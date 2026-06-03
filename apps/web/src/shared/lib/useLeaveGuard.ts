'use client';

import { useEffect } from 'react';

// isDirty 상태일 때 브라우저 새로고침/탭 닫기 시 확인 다이얼로그를 띄운다.
// 라우터 이탈(Next.js router.push 등) 확인은 호출 측에서 모달로 처리한다.
export function useLeaveGuard(isDirty: boolean) {
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!isDirty) return;
            e.preventDefault();
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);
}
