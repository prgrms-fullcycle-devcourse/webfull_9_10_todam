'use client';

import React from 'react';

import { CalendarIcon, HomeIcon, SearchIcon, SettingIcon, ThreeDIcon, UserIcon } from '@todam/ui';
import type { IconProps } from '@todam/ui';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';

export type BottomNavRole = 'customer' | 'store';

type NavItem = {
    label: string;
    icon: ComponentType<IconProps>;
    href: string;
    exact?: boolean;
};

const customerItems: NavItem[] = [
    { label: '홈', icon: HomeIcon, href: '/', exact: true },
    { label: '예약', icon: CalendarIcon, href: '/reservations' },
    { label: '공방 찾기', icon: SearchIcon, href: '/search' },
    { label: '마이', icon: UserIcon, href: '/my' },
];

const storeItems: NavItem[] = [
    { label: '홈', icon: HomeIcon, href: '/partner', exact: true },
    { label: '예약', icon: CalendarIcon, href: '/partner/reservations' },
    { label: '작품', icon: ThreeDIcon, href: '/partner/works' },
    { label: '설정', icon: SettingIcon, href: '/partner/settings' },
];

type BottomNavProps = {
    role?: BottomNavRole;
};

export function BottomNav({ role = 'customer' }: BottomNavProps) {
    const pathname = usePathname();
    const items = role === 'store' ? storeItems : customerItems;

    return (
        <nav className="shrink-0 border-t border-border-subtle bg-surface pb-safe">
            <div className="flex h-16 items-start px-4 pt-1">
                {items.map(({ label, icon: Icon, href, exact }) => {
                    const active = exact ? pathname === href : pathname.startsWith(href);
                    return (
                        <button
                            key={label}
                            type="button"
                            className={`flex flex-1 flex-col items-center justify-start gap-1 self-stretch text-xs ${
                                active
                                    ? 'font-medium text-primary'
                                    : 'font-normal text-foreground-tertiary'
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
