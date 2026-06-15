'use client';

import { usePathname, useRouter } from 'next/navigation';

import { useHeaderActionStore } from '@/shared/model';

export type LayoutHeaderType =
    | 'home'
    | 'main'
    | 'mainText'
    | 'sub'
    | 'subText'
    | 'popup'
    | 'search';

type HeaderConfig = {
    type: LayoutHeaderType;
    title?: string;
};

const routeConfig: Record<string, HeaderConfig> = {
    '/': { type: 'home' },
    '/my': { type: 'main', title: '마이페이지' },
    '/notifications': { type: 'sub', title: '알림' },
    '/my/profile': { type: 'sub', title: '개인 정보 수정' },
    '/my/favorites': { type: 'sub', title: '찜한 공방' },
    '/my/reservations': { type: 'sub', title: '나의 예약' },
    '/partner': { type: 'home' },
    '/partner/classes': { type: 'sub', title: '클래스 관리' },
    '/partner/reservations': { type: 'main', title: '예약 관리' },
    '/partner/reservations/new': { type: 'sub', title: '예약 등록하기' },
    '/partner/artworks': { type: 'main', title: '작품 관리' },
    '/partner/settings': { type: 'main', title: '설정' },
    '/partner/settings/profile': { type: 'sub', title: '개인 정보 수정' },
    '/partner/settings/business': { type: 'sub', title: '사업자 정보' },
};

// 동적 경로(파라미터 포함)는 정확 일치로 못 잡으므로 패턴으로 매칭.
const patternConfig: Array<{ test: RegExp; config: HeaderConfig }> = [
    {
        test: /^\/partner\/classes\/(?!new$|order$)[^/]+$/,
        config: { type: 'sub', title: '클래스 미리보기' },
    },
    {
        test: /^\/my\/reservations\/[^/]+\/delivery\/edit$/,
        config: { type: 'sub', title: '배송 정보' },
    },
    {
        test: /^\/my\/reservations\/[^/]+$/,
        config: { type: 'sub', title: '예약 자세히보기' },
    },
    {
        test: /^\/partner\/reservations\/[^/]+$/,
        config: { type: 'sub', title: '예약 자세히보기' },
    },
    {
        test: /^\/my\/artworks\/[^/]+$/,
        config: { type: 'sub', title: '작품 제작 단계' },
    },
    {
        test: /^\/partner\/artworks\/[^/]+$/,
        config: { type: 'sub', title: '작품 자세히보기' },
    },
];

export type UseHeaderResult =
    | { visible: false }
    | {
          visible: true;
          type: LayoutHeaderType;
          title?: string;
          onBack: () => void;
          onClose?: () => void;
      };

export function useHeader(): UseHeaderResult {
    const pathname = usePathname();
    const router = useRouter();
    const override = useHeaderActionStore((s) => s.override);

    const config =
        routeConfig[pathname] ?? patternConfig.find((p) => p.test.test(pathname))?.config;

    // route config 도 override 도 없으면 헤더 숨김.
    if (!config && !override) return { visible: false };

    // override 가 route config 보다 우선. onBack 미지정 시 router.back().
    return {
        visible: true,
        type: override?.type ?? config?.type ?? 'sub',
        title: override?.title ?? config?.title,
        onBack: override?.onBack ?? (() => router.back()),
        onClose: override?.onClose,
    };
}
