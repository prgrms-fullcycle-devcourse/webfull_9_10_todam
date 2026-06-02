'use client';

import { CalendarIcon, HomeIcon, SearchIcon, SettingIcon, ThreeDIcon, UserIcon } from '@todam/ui';
import type { IconProps } from '@todam/ui';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';

export type BottomNavigationRole = 'customer' | 'partner';

export type BottomNavigationItem = {
    label: string;
    href: string;
    active: boolean;
    Icon: ComponentType<IconProps>;
};

type NavigationConfigItem = {
    label: string;
    href: string;
    Icon: ComponentType<IconProps>;
};

const customerItems: NavigationConfigItem[] = [
    { label: '홈', Icon: HomeIcon, href: '/' },
    { label: '예약', Icon: CalendarIcon, href: '/my/reservations' },
    { label: '찾기', Icon: SearchIcon, href: '/search' },
    { label: '마이', Icon: UserIcon, href: '/my' },
];

const partnerItems: NavigationConfigItem[] = [
    { label: '홈', Icon: HomeIcon, href: '/partner' },
    { label: '예약', Icon: CalendarIcon, href: '/partner/reservations' },
    { label: '작품', Icon: ThreeDIcon, href: '/partner/artworks' },
    { label: '설정', Icon: SettingIcon, href: '/partner/settings' },
];

const customerVisiblePaths = new Set(['/', '/my', '/my/reservations']);
const partnerVisiblePaths = new Set(partnerItems.map(({ href }) => href));

export function useBottomNavigation(): {
    visible: boolean;
    role: BottomNavigationRole | null;
    items: BottomNavigationItem[];
} {
    const pathname = usePathname();

    if (customerVisiblePaths.has(pathname)) {
        return {
            visible: true,
            role: 'customer',
            items: customerItems.map((item) => ({
                ...item,
                active: item.href === pathname,
            })),
        };
    }

    if (partnerVisiblePaths.has(pathname)) {
        return {
            visible: true,
            role: 'partner',
            items: partnerItems.map((item) => ({
                ...item,
                active: item.href === pathname,
            })),
        };
    }

    return { visible: false, role: null, items: [] };
}
