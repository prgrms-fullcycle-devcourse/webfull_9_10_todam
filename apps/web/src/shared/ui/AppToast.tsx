'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toast } from '@todam/ui';

import { useToastStore, type ToastItem } from '../model/toast';

function ToastView({ item }: { item: ToastItem }) {
    const dismiss = useToastStore((s) => s.dismiss);

    useEffect(() => {
        if (!item.duration) return;
        const timer = setTimeout(() => dismiss(item.id), item.duration);
        return () => clearTimeout(timer);
    }, [item.id, item.duration, dismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto"
        >
            <Toast
                type={item.type}
                message={item.message}
                icon={item.icon}
                actionLabel={item.actionLabel}
                onAction={() => {
                    item.onAction?.();
                    dismiss(item.id);
                }}
            />
        </motion.div>
    );
}

export function AppToast() {
    const toasts = useToastStore((s) => s.toasts);

    return (
        <div className="pointer-events-none absolute inset-x-4 bottom-20 z-50 flex flex-col gap-2">
            <AnimatePresence initial={false}>
                {toasts.map((item) => (
                    <ToastView key={item.id} item={item} />
                ))}
            </AnimatePresence>
        </div>
    );
}
