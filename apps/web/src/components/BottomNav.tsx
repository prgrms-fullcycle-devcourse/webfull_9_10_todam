'use client';

import { BookmarkIcon, HomeIcon, SearchIcon, UserCircleIcon } from '@todam/ui';
import type { IconProps } from '@todam/ui';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';

type NavItem = {
    label: string;
    icon: ComponentType<IconProps>;
    href: string;
};

const items: NavItem[] = [
    { label: '홈', icon: HomeIcon, href: '/' },
    { label: '검색', icon: SearchIcon, href: '/search' },
    { label: '저장', icon: BookmarkIcon, href: '/bookmark' },
    { label: '내정보', icon: UserCircleIcon, href: '/my' },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="shrink-0 border-t border-border-subtle bg-surface pb-safe">
            <div className="flex h-16 items-center justify-around">
                {items.map(({ label, icon: Icon, href }) => {
                    const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                    return (
                        <button
                            key={label}
                            type="button"
                            className={`flex flex-1 flex-col items-center justify-center gap-1 self-stretch text-xs ${
                                active ? 'text-primary' : 'text-foreground-tertiary'
                            }`}
                        >
                            <Icon size={24} />
                            {label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
