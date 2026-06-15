'use client';

import { useEffect } from 'react';

/**
 * 활성화되는 동안 배경(뒤 페이지) 스크롤을 잠근다.
 * 바텀시트/모달이 열렸을 때 dim 너머 본문이 스크롤되거나
 * 모바일 동적 툴바 변화로 화면이 흔들리는 현상을 막는다.
 *
 * 여러 오버레이가 동시에 열려도 중첩 카운트로 안전하게 동작하며,
 * 마지막 잠금이 해제될 때만 원래 스타일을 복원한다.
 */
let lockCount = 0;
let prevOverflow = '';
let prevTouchAction = '';

function applyLock() {
    if (lockCount === 0) {
        const { body } = document;
        prevOverflow = body.style.overflow;
        prevTouchAction = body.style.touchAction;
        body.style.overflow = 'hidden';
        body.style.touchAction = 'none';
    }
    lockCount += 1;
}

function releaseLock() {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
        const { body } = document;
        body.style.overflow = prevOverflow;
        body.style.touchAction = prevTouchAction;
    }
}

export function useScrollLock(active: boolean) {
    useEffect(() => {
        if (!active) return;
        applyLock();
        return releaseLock;
    }, [active]);
}
