import { create } from 'zustand';
import type { ReactElement, ReactNode } from 'react';

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 3000;

export type ToastItem = {
    id: string;
    message: ReactNode;
    type?: 'icon' | 'button';
    icon?: ReactElement<{ size?: number }>;
    actionLabel?: string;
    onAction?: () => void;
    duration?: number;
};

type ToastStore = {
    toasts: ToastItem[];
    push: (toast: Omit<ToastItem, 'id'>) => string;
    dismiss: (id: string) => void;
};

export function useToast() {
    const push = useToastStore((s) => s.push);
    const dismiss = useToastStore((s) => s.dismiss);
    return { push, dismiss };
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    push: (toast) => {
        const id = crypto.randomUUID();
        const item: ToastItem = {
            id,
            duration: DEFAULT_DURATION,
            ...toast,
        };
        set((state) => ({
            toasts: [item, ...state.toasts].slice(0, MAX_TOASTS),
        }));
        return id;
    },
    dismiss: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}));
