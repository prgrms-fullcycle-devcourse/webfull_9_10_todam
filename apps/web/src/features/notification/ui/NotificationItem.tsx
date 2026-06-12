'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@todam/ui';

import type { Notification } from '@todam/shared';

import { formatNotificationTime, NOTIFICATION_CATEGORY_META } from '../model/format';

export type NotificationItemProps = {
    notification: Notification;
    onRead: (id: string) => void;
};

// 알림 카드 — 카테고리 배지 + 제목 + 본문 + 상대시간. 미읽음은 시간 우측 빨간 점 + surface 강조.
export function NotificationItem({ notification, onRead }: NotificationItemProps) {
    const router = useRouter();
    const meta = NOTIFICATION_CATEGORY_META[notification.category];
    const isUnread = notification.readAt == null;

    const handleClick = () => {
        if (isUnread) onRead(notification.id);
        if (notification.deepLink) router.push(notification.deepLink);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={[
                'flex w-full flex-col gap-2 rounded-2xl p-4 text-left cursor-pointer',
                isUnread ? 'bg-surface border border-border-subtle' : 'bg-surface/50',
            ].join(' ')}
        >
            <div className="flex items-center justify-between gap-2">
                <Badge tone={meta.tone} className="shrink-0">
                    {meta.label}
                </Badge>
                {/* 시간 + 미읽음 점. 읽음 시 점 숨김 → 시간이 우측으로 당겨짐. */}
                <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-foreground-tertiary">
                        {formatNotificationTime(notification.createdAt)}
                    </span>
                    {isUnread && <span className="size-2 shrink-0 rounded-full bg-danger" />}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <p
                    className={[
                        'text-sm',
                        isUnread
                            ? 'font-semibold text-foreground'
                            : 'font-medium text-foreground-secondary',
                    ].join(' ')}
                >
                    {notification.title}
                </p>
                <p className="line-clamp-2 text-xs text-foreground-tertiary">{notification.body}</p>
            </div>
        </button>
    );
}
