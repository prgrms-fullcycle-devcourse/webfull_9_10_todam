'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { useModalStore } from '../store/modal';

export function AppModal() {
    const { isOpen, content } = useModalStore();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {content}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
