'use client';

import Link from 'next/link';

import { isProtectedPath, useLoginRequiredGuard } from '@/features/auth/guard';
import { primeMobileKeyboard } from '@/shared/lib/primeMobileKeyboard';

import { useBottomNavigation } from '../model/useBottomNavigation';

export function BottomNav() {
    const { visible, items } = useBottomNavigation();
    const guardLogin = useLoginRequiredGuard();

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
                            // 로그인 필요 경로: 확정 미인증이면 진입을 막고 제자리 모달.
                            if (isProtectedPath(href) && guardLogin()) {
                                e.preventDefault();
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
