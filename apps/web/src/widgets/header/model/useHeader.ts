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
    '/partner/classes': { type: 'sub', title: '클래스 관리' },
    '/partner/reservations': { type: 'sub', title: '예약' },
    '/partner/artworks': { type: 'sub', title: '작품' },
    '/partner/settings': { type: 'sub', title: '설정' },
};

// 동적 경로(파라미터 포함)는 정확 일치로 못 잡으므로 패턴으로 매칭.
const patternConfig: Array<{ test: RegExp; config: HeaderConfig }> = [
    // `new`(등록 플로우)는 자체 헤더 보유 → 전역 헤더 제외. 상세(program id)만 매칭.
    {
        test: /^\/partner\/classes\/(?!new$)[^/]+$/,
        config: { type: 'sub', title: '클래스 미리보기' },
    },
    // 배송 정보 수정 — 예약 상세 하위 라우트. 정확 일치를 위해 동적 id 패턴 앞에 둠.
    {
        test: /^\/my\/reservations\/[^/]+\/delivery\/edit$/,
        config: { type: 'sub', title: '배송 정보' },
    },
    {
        test: /^\/my\/reservations\/[^/]+$/,
        config: { type: 'sub', title: '예약 자세히보기' },
    },
    {
        test: /^\/my\/artworks\/[^/]+$/,
        config: { type: 'sub', title: '작품 제작 단계' },
    },
];

export type UseHeaderResult =
    | { visible: false }
    | { visible: true; type: LayoutHeaderType; title?: string; onBack: () => void };

export function useHeader(): UseHeaderResult {
    const pathname = usePathname();
    const router = useRouter();

    const config =
        routeConfig[pathname] ?? patternConfig.find((p) => p.test.test(pathname))?.config;
    if (!config) return { visible: false };

    return {
        visible: true,
        ...config,
        onBack: () => router.back(),
    };
}
