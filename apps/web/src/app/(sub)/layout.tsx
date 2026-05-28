import type { ReactNode } from 'react';

type SubLayoutProps = {
    children: ReactNode;
};

export default function SubLayout({ children }: SubLayoutProps) {
    return <main className="flex-1 overflow-y-auto">{children}</main>;
}
