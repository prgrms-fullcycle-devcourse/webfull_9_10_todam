'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { useSheetStore } from '../model/sheet';

export function AppSheet() {
    const { isOpen, content, close } = useSheetStore();

    return (
        <AnimatePresence>
            {isOpen && (
                // dim 배경: 제자리 fade in/out.
                <motion.div
                    className="absolute inset-0 bg-inverse/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={close}
                >
                    {/* 패널: 아래에서 위로 slide, drag 내려서 닫기. */}
                    <motion.div
                        className="absolute inset-x-0 bottom-0"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.25 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={{ top: 0, bottom: 0.3 }}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100 || info.velocity.y > 500) close();
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {content}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
