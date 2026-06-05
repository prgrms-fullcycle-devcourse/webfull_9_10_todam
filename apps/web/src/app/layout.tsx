import type { ReactNode } from 'react';

import { AuthTokenProvider } from '@/features/auth/login';
import { MswProvider } from '../mocks/MswProvider';
import { AppModal, AppSheet, AppToast } from '../shared/ui';
import { AppShell } from './AppShell';
import { QueryProvider } from './QueryProvider';

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
                        <AuthTokenProvider>
                            <div className="relative flex h-dvh w-full max-w-[430px] flex-col bg-background">
                                <AppShell>{children}</AppShell>
                                <AppModal />
                                <AppSheet />
                                <AppToast />
                            </div>
                        </AuthTokenProvider>
                    </QueryProvider>
                </MswProvider>
            </body>
        </html>
    );
}
