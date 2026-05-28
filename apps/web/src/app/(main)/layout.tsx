import type { ReactNode } from 'react';

import { BottomNav } from '../../components/BottomNav';

type MainLayoutProps = {
    children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <>
            <main className="flex-1 overflow-y-auto">{children}</main>
            <BottomNav />
        </>
    );
}
