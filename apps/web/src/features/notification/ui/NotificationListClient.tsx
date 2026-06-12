'use client';

import { useEffect, useRef } from 'react';

import { EmptyState } from '@/shared/ui';

import { useInfiniteNotifications, useReadAllNotifications, useReadNotification } from '../queries';
import { NotificationItem } from './NotificationItem';

export function NotificationListClient() {
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteNotifications();
    const readOne = useReadNotification();
    const readAll = useReadAllNotifications();

    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting) && hasNextPage && !isFetchingNextPage) {
                    void fetchNextPage();
                }
            },
            { threshold: 0.1 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];
    const unreadCount = data?.pages[0]?.unreadCount ?? 0;

    if (isLoading) {
        return (
            <main className="flex flex-1 items-center justify-center px-4 py-6">
                <p className="text-sm text-foreground-tertiary">불러오는 중...</p>
            </main>
        );
    }

    if (notifications.length === 0) {
        return (
            <main className="flex flex-1 items-center justify-center px-4 py-6">
                <EmptyState message="아직 도착한 알림이 없어요" />
            </main>
        );
    }

    return (
        <main className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            {unreadCount > 0 && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => readAll.mutate()}
                        disabled={readAll.isPending}
                        className="text-xs font-semibold text-foreground-secondary disabled:opacity-50 cursor-pointer"
                    >
                        모두 읽음
                    </button>
                </div>
            )}

            <ul className="flex flex-col gap-3">
                {notifications.map((notification) => (
                    <li key={notification.id}>
                        <NotificationItem
                            notification={notification}
                            onRead={(id) => readOne.mutate(id)}
                        />
                    </li>
                ))}
            </ul>

            <div ref={sentinelRef} className="h-4" />
            {isFetchingNextPage && (
                <p className="py-2 text-center text-xs text-foreground-tertiary">불러오는 중...</p>
            )}
        </main>
    );
}
