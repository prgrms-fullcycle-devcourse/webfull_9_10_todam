'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/features/auth/login';
import { primeMobileKeyboard } from '@/shared/lib/primeMobileKeyboard';

import { useBottomNavigation } from '../model/useBottomNavigation';

const AUTH_REQUIRED_PATHS = new Set(['/my', '/my/reservations']);

export function BottomNav() {
    const { visible, items } = useBottomNavigation();
    const isAuthenticated = useAuthStore((s) => s.state === 'AUTHENTICATED');
    const router = useRouter();

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
                        onClick={(e) => {
                            if (!isAuthenticated && AUTH_REQUIRED_PATHS.has(href)) {
                                e.preventDefault();
                                router.push('/login');
                                return;
                            }
                            // 검색 진입 — 탭 제스처 안에서 키보드를 미리 띄워 모바일 autofocus 한계를 회피.
                            if (href === '/search') primeMobileKeyboard();
                        }}
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
