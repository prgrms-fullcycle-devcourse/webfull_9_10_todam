'use client';

import { useEffect, useRef } from 'react';

import { useSheet } from '@/shared/model';

import { OnboardingSheet, type OnboardingSheetProps } from '../ui/OnboardingSheet';

// 온보딩 바텀시트 노출 트리거.
//
// ⚠️ 노출 판단 기준(isOnboarded)은 API Contract에 필드가 없다(plan Open decision #1).
// 따라서 실제 API 필드에 의존하지 않고, 호출 측(부모)이 shouldShow 로 노출 시점을
// 주입한다. Open decision #1 확정 후 부모에서 GET /users/me 의 isOnboarded 등으로
// shouldShow 를 계산해 넘기면 된다.

type UseOnboardingSheetParams = {
    // 온보딩 바텀시트 노출 여부. 부모가 주입 (contract 변경에 영향받지 않게).
    shouldShow: boolean;
} & OnboardingSheetProps;

export function useOnboardingSheet({ shouldShow, ...callbacks }: UseOnboardingSheetParams) {
    const { open } = useSheet();
    const openedRef = useRef(false);

    useEffect(() => {
        if (!shouldShow || openedRef.current) return;
        openedRef.current = true;
        // openedRef 가드로 1회만 열린다. callbacks 는 매 렌더 재생성될 수 있어 deps 제외.
        open(<OnboardingSheet {...callbacks} />);
    }, [shouldShow, open, callbacks]);
}
