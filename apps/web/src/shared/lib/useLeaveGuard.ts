'use client';

import { useEffect, useRef } from 'react';

// isDirty 상태일 때 이탈을 가드한다.
// - 브라우저 새로고침/탭 닫기: beforeunload 네이티브 다이얼로그.
// - 브라우저/제스처 뒤로가기(popstate): sentinel history 로 가로채 onGuardedBack 콜백 호출
//   (호출 측이 확인 모달을 띄운다). 확인 시 콜백 안에서 실제 이탈(router) 처리.
// - 앱 내 헤더 뒤로가기는 onBack 모달로 별도 처리(여기선 popstate 만).
export function useLeaveGuard(isDirty: boolean, onGuardedBack?: () => void) {
    const cbRef = useRef(onGuardedBack);
    // 렌더 중 ref 직접 수정 금지 → 매 커밋마다 최신 콜백으로 갱신.
    useEffect(() => {
        cbRef.current = onGuardedBack;
    });

    // 새로고침/탭 닫기
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!isDirty) return;
            e.preventDefault();
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    // 브라우저/제스처 뒤로가기(popstate)
    useEffect(() => {
        if (!isDirty) return;
        const url = window.location.href;
        // sentinel: 뒤로가기를 가로채기 위해 현재 화면 더미 엔트리를 쌓는다.
        window.history.pushState(null, '', url);
        const onPop = () => {
            // 뒤로가기가 sentinel 을 소비함 → 같은 화면 유지하도록 재주입 후 확인 모달.
            window.history.pushState(null, '', url);
            cbRef.current?.();
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, [isDirty]);
}
