import { create } from 'zustand';
import type { ReactNode } from 'react';

type SheetStore = {
    isOpen: boolean;
    content: ReactNode | null;
    open: (content: ReactNode) => void;
    close: () => void;
};

export function useSheet() {
    const open = useSheetStore((s) => s.open);
    const close = useSheetStore((s) => s.close);
    return { open, close };
}

export const useSheetStore = create<SheetStore>((set) => ({
    isOpen: false,
    content: null,
    open: (content) => set({ isOpen: true, content }),
    close: () => set({ isOpen: false, content: null }),
}));
