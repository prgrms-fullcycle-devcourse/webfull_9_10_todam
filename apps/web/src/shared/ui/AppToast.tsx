'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toast } from '@todam/ui';

// 배럴(index) 대신 훅 모델만 직접 import — 배럴은 BottomNav(앱 alias 의존)까지 끌어와 Storybook 번들이 깨짐.
import { useBottomNavigation } from '../../widgets/bottom-navigation/model/useBottomNavigation';

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
    // 하단 네비게이션 유무에 따라 토스트 기준 위치를 조정.
    // 바가 있는 화면: 바 위로 띄움(bottom-28). 없는 화면(로그인/회원가입 등): 화면 맨 아래(safe-area 위)로 내려 표준 토스트 위치 확보.
    const { visible: hasBottomNav } = useBottomNavigation();
    const bottomClass = hasBottomNav
        ? 'bottom-28'
        : 'bottom-[calc(1.5rem+env(safe-area-inset-bottom))]';

    return (
        <div
            className={`pointer-events-none absolute inset-x-4 ${bottomClass} z-50 flex flex-col gap-2`}
        >
            <AnimatePresence initial={false}>
                {toasts.map((item) => (
                    <ToastView key={item.id} item={item} />
                ))}
            </AnimatePresence>
        </div>
    );
}
