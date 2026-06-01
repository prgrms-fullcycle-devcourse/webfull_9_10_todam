import { create } from 'zustand';
import type { ReactNode } from 'react';

// 헤더 우측 액션 슬롯. 페이지가 mount 시 등록하고 unmount 시 해제한다.
// Header 위젯은 route-driven(layout 마운트)이라 페이지가 직접 props 를 줄 수 없어 store 로 주입한다.
type HeaderActionStore = {
    action: ReactNode | null;
    setAction: (action: ReactNode) => void;
    clearAction: () => void;
};

export const useHeaderActionStore = create<HeaderActionStore>((set) => ({
    action: null,
    setAction: (action) => set({ action }),
    clearAction: () => set({ action: null }),
}));
