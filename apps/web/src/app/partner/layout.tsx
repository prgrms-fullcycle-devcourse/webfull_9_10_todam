import type { ReactNode } from 'react';

import { BottomNav } from '../../components/BottomNav';

type PartnerMainLayoutProps = {
    children: ReactNode;
};

export default function PartnerMainLayout({ children }: PartnerMainLayoutProps) {
    return (
        <>
            {children}
            <BottomNav role="store" />
        </>
    );
}
