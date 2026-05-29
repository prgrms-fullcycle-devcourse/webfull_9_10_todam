'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { useModalStore } from '../store/modal';

export function AppModal() {
    const { isOpen, content } = useModalStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const root = document.getElementById('modal-root');
    if (!root) return null;

    return createPortal(
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
        </AnimatePresence>,
        root,
    );
}
