'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useModalStore } from '../model/modal';

export function AppModal() {
    const { isOpen, content, close } = useModalStore();

    // Esc 키로 닫기 (열려 있을 때만).
    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, close]);

    return (
        <AnimatePresence>
            {isOpen && (
                // dim 백드롭: 제자리 fade. 클릭 시 닫기(패널은 stopPropagation). AppSheet 동일 패턴.
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    className="absolute inset-0 z-[60] flex items-center justify-center bg-inverse/80 px-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={close}
                >
                    {content}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
