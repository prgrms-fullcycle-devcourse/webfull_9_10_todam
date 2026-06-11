import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { IosInstallBanner, ServiceWorkerRegistrar } from '@/features/notification';
import { SuspendedStudioGate } from '@/features/studio/switch';

import { MswProvider } from '../mocks/MswProvider';
import { AppModal, AppSheet, AppToast } from '../shared/ui';
import { AppShell } from './AppShell';
import { AuthProvider } from './providers/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';

import '../styles/globals.css';

export const metadata: Metadata = {
    manifest: '/manifest.webmanifest',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'todam',
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

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="ko">
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
                                {/* Phase 1: SW 등록. FCM 연동은 Phase 2에서. */}
                                <ServiceWorkerRegistrar />
                                {/* Phase 1: iOS Safari 미설치 환경 홈화면 추가 안내. */}
                                <IosInstallBanner />
                            </div>
                        </AuthProvider>
                    </QueryProvider>
                </MswProvider>
            </body>
        </html>
    );
}
