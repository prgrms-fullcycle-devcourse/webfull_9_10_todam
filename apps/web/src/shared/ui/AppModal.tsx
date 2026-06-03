'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { useModalStore } from '../model/modal';

export function AppModal() {
    const { isOpen, content, close } = useModalStore();

    return (
        <AnimatePresence>
            {isOpen && (
                // dim 백드롭: 제자리 fade. 클릭 시 닫기(패널은 stopPropagation). AppSheet 동일 패턴.
                <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-inverse/80 px-5"
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
