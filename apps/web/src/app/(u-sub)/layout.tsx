import type { ReactNode } from 'react';

type SubLayoutProps = {
    children: ReactNode;
};

export default function SubLayout({ children }: SubLayoutProps) {
    return <>{children}</>;
}
