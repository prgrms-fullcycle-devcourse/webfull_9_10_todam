'use client';

import { usePathname, useRouter } from 'next/navigation';

export type LayoutHeaderType = 'home' | 'main' | 'sub';

type HeaderConfig = {
    type: LayoutHeaderType;
    title?: string;
};

const routeConfig: Record<string, HeaderConfig> = {
    '/': { type: 'home' },
    '/my': { type: 'main', title: '마이' },
    '/my/reservations': { type: 'sub', title: '예약' },
    '/partner': { type: 'home' },
    '/partner/stores': { type: 'sub', title: '공방 관리' },
    '/partner/reservations': { type: 'sub', title: '예약' },
    '/partner/artworks': { type: 'sub', title: '작품' },
    '/partner/settings': { type: 'sub', title: '설정' },
};

export type UseHeaderResult =
    | { visible: false }
    | { visible: true; type: LayoutHeaderType; title?: string; onBack: () => void };

export function useHeader(): UseHeaderResult {
    const pathname = usePathname();
    const router = useRouter();

    const config = routeConfig[pathname];
    if (!config) return { visible: false };

    return {
        visible: true,
        ...config,
        onBack: () => router.back(),
    };
}
