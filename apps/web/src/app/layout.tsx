import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import Image from 'next/image';
import type { ReactNode } from 'react';

import {
    IosInstallBanner,
    PushMessageListener,
    ServiceWorkerRegistrar,
} from '@/features/notification';
import { SuspendedStudioGate } from '@/features/studio/switch';

import { AppModal, AppSheet, AppToast } from '../shared/ui';
import { AppShell } from './AppShell';
import { BrandPanel } from './BrandPanel';
import { AuthProvider } from './providers/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';

import '../styles/globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://todam.app';
const APP_NAME = '토담';
const APP_SLOGAN = '당신의 작품이 머무는 시간';
const APP_DESCRIPTION = '도자기 공방 예약부터 완성까지, 내 작품의 여정을 기록하세요.';
const APP_TITLE = `${APP_NAME} | ${APP_SLOGAN}`;

export const metadata: Metadata = {
    metadataBase: new URL(APP_URL),
    title: {
        default: APP_TITLE,
        template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    applicationName: APP_NAME,
    manifest: '/manifest.webmanifest',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: APP_NAME,
    },
    openGraph: {
        type: 'website',
        siteName: APP_NAME,
        title: APP_TITLE,
        description: APP_DESCRIPTION,
        url: APP_URL,
        locale: 'ko_KR',
        images: [
            {
                url: '/OG-image.png',
                width: 1024,
                height: 559,
                alt: APP_NAME,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: APP_TITLE,
        description: APP_DESCRIPTION,
        images: ['/OG-image.png'],
    },
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover' as const,
    themeColor: '#fbf8f3',
};

type RootLayoutProps = {
    children: ReactNode;
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="ko">
            {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
            <body className="relative flex h-dvh justify-center bg-[#efe9dd] text-foreground">
                {/* 와이드 화면 전역 브랜드 그래픽 — 패널 박스 경계 넘어 뷰포트 배경 전체 사용 */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-0 hidden xl:block"
                >
                    <Image
                        src="/bg-image.png"
                        alt=""
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover object-left-bottom"
                    />
                    {/* 상단을 크림으로 덮어 텍스트 가독 확보 — 하단은 투명해 도자기 노출 */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#efe9dd] from-20% via-[#efe9dd]/70 to-transparent" />
                </div>
                <BrandPanel />
                <QueryProvider>
                    <AuthProvider>
                        <div className="relative flex h-dvh w-full max-w-[430px] flex-col bg-background">
                            <AppShell>{children}</AppShell>
                            <AppModal />
                            <AppSheet />
                            <AppToast />
                            {/* 작업 공방 게시중단 시 전체 takeover 오버레이(파트너 영역, 자체 가드). */}
                            <SuspendedStudioGate />
                            {/* SW 등록 (FCM 백그라운드 수신 전제). */}
                            <ServiceWorkerRegistrar />
                            {/* 포그라운드 FCM 메시지 → 토스트 + 토큰 silent 재등록. */}
                            <PushMessageListener />
                            {/* iOS Safari 미설치 환경 홈화면 추가 안내. */}
                            <IosInstallBanner />
                        </div>
                    </AuthProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
