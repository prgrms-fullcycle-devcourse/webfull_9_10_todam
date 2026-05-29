import type { ReactNode } from 'react';

import { AppModal } from '../components/AppModal';
import { AppSheet } from '../components/AppSheet';
import { AppToast } from '../components/AppToast';
import { BottomNav } from '../widgets/bottom-navigation';
import { Header } from '../widgets/header';

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
            <body className="flex h-dvh justify-center bg-background text-foreground">
                <div
                    aria-hidden
                    className="hidden w-[500px] shrink-0 items-center justify-center bg-primary text-foreground-inverse/70 lg:flex"
                >
                    graphic placeholder
                </div>
                <div className="relative flex h-dvh w-full max-w-[430px] flex-col bg-surface">
                    <Header />
                    {children}
                    <BottomNav />
                    <AppModal />
                    <AppSheet />
                    <AppToast />
                </div>
            </body>
        </html>
    );
}
