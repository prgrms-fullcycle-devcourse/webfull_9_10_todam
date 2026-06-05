import type { ReactNode } from 'react';

import { SuspendedStoreGate } from '@/features/store/switch';

import { MswProvider } from '../mocks/MswProvider';
import { AppModal, AppSheet, AppToast } from '../shared/ui';
import { AppShell } from './AppShell';
import { AuthProvider } from './providers/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';

import '../styles/globals.css';

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover' as const,
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
                    className="hidden w-[500px] shrink-0 items-center justify-center bg-primary text-foreground-inverse/70 lg:flex"
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
                                <SuspendedStoreGate />
                            </div>
                        </AuthProvider>
                    </QueryProvider>
                </MswProvider>
            </body>
        </html>
    );
}
