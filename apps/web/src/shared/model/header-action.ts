import { create } from 'zustand';
import type { ReactNode } from 'react';

// 전역 Header 위젯은 route-driven(layout 마운트)이라 페이지가 직접 props 를 줄 수 없다.
// 페이지/플로우가 mount 시 store 로 주입하고 unmount 시 해제한다.
//
// - action: 헤더 우측 액션 슬롯(메뉴/닫기 버튼 등).
// - override: route config 로 못 잡는 화면(등록·수정 플로우)이 헤더 표시/타이틀/뒤로가기를 직접 지정.
//   useHeader 에서 route config 보다 우선 병합된다.
type HeaderOverrideType = 'home' | 'main' | 'mainText' | 'sub' | 'subText' | 'popup' | 'search';

export type HeaderOverride = {
    type?: HeaderOverrideType;
    title?: string;
    // 커스텀 뒤로가기(dirty 이탈 가드 등). 미지정 시 router.back().
    onBack?: () => void;
    // 우측 닫기(X). 등록 플로우. 지정 시 'sub' 헤더가 noti 대신 닫기 버튼을 렌더.
    onClose?: () => void;
};

type HeaderActionStore = {
    action: ReactNode | null;
    setAction: (action: ReactNode) => void;
    clearAction: () => void;
    override: HeaderOverride | null;
    setOverride: (override: HeaderOverride) => void;
    clearOverride: () => void;
};

export const useHeaderActionStore = create<HeaderActionStore>((set) => ({
    action: null,
    setAction: (action) => set({ action }),
    clearAction: () => set({ action: null }),
    override: null,
    setOverride: (override) => set({ override }),
    clearOverride: () => set({ override: null }),
}));
