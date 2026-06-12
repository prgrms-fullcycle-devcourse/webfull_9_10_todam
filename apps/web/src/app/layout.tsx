import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import type { ReactNode } from 'react';

import {
    IosInstallBanner,
    PushMessageListener,
    ServiceWorkerRegistrar,
} from '@/features/notification';
import { SuspendedStudioGate } from '@/features/studio/switch';

import { MswProvider } from '../mocks/MswProvider';
import { AppModal, AppSheet, AppToast } from '../shared/ui';
import { AppShell } from './AppShell';
import { AuthProvider } from './providers/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';

import '../styles/globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://todam.kr';
const APP_NAME = '토담';
const APP_DESCRIPTION = '당신의 작품이 머무르는 시간';

export const metadata: Metadata = {
    metadataBase: new URL(APP_URL),
    title: {
        default: `${APP_NAME} | ${APP_DESCRIPTION}`,
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
        title: `${APP_NAME} | ${APP_DESCRIPTION}`,
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
        title: `${APP_NAME} | ${APP_DESCRIPTION}`,
        description: APP_DESCRIPTION,
        images: ['/OG-image.png'],
    },
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover' as const,
    themeColor: '#1a3d2b',
};

type RootLayoutProps = {
    children: ReactNode;
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="ko">
            {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
            <body className="flex h-dvh justify-center bg-surface text-foreground">
                <div
                    aria-hidden
                    className="hidden w-[500px] shrink-0 items-center justify-center bg-primary text-foreground-inverse/70 xl:flex"
                >
                    graphic placeholder
                </div>
                <MswProvider>
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
                </MswProvider>
            </body>
        </html>
    );
}
