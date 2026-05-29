'use client';

import Link from 'next/link';

import { useBottomNavigation } from '../model/useBottomNavigation';

export function BottomNav() {
    const { visible, items } = useBottomNavigation();

    if (!visible) {
        return null;
    }

    return (
        <nav className="shrink-0 border-t border-border-subtle bg-surface pb-safe">
            <div className="flex h-16 items-start px-4 pt-1">
                {items.map(({ label, href, Icon, active }) => (
                    <Link
                        key={label}
                        href={href}
                        className={`flex flex-1 flex-col items-center justify-start gap-1 self-stretch text-xs ${
                            active
                                ? 'font-medium text-primary'
                                : 'font-normal text-foreground-tertiary'
                        }`}
                    >
                        <Icon size={24} />
                        {label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
