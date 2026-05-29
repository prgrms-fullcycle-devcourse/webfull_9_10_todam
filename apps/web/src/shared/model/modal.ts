import { create } from 'zustand';
import type { ReactNode } from 'react';

type ModalStore = {
    isOpen: boolean;
    content: ReactNode | null;
    open: (content: ReactNode) => void;
    close: () => void;
};

export function useModal() {
    const open = useModalStore((s) => s.open);
    const close = useModalStore((s) => s.close);
    return { open, close };
}

export const useModalStore = create<ModalStore>((set) => ({
    isOpen: false,
    content: null,
    open: (content) => set({ isOpen: true, content }),
    close: () => set({ isOpen: false, content: null }),
}));
