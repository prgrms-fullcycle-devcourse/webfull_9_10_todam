'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { useSheetStore } from '../store/sheet';

export function AppSheet() {
    const { isOpen, content, close } = useSheetStore();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ duration: 0.25 }}
                    drag="y"
                    dragConstraints={{ top: 0 }}
                    dragElastic={{ top: 0, bottom: 0.3 }}
                    onDragEnd={(_, info) => {
                        if (info.offset.y > 100 || info.velocity.y > 500) close();
                    }}
                >
                    {content}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
