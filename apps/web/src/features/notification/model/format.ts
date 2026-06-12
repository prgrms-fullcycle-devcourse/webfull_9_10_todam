import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

import type { NotificationCategory } from '@todam/shared';
import type { BadgeTone } from '@todam/ui';

// "3분 전" 상대 시간. 파싱 실패 시 빈 문자열.
export function formatNotificationTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return formatDistanceToNow(d, { addSuffix: true, locale: ko });
}

// 카테고리 → 뱃지 톤 + 라벨 (정책 §4·§5).
export const NOTIFICATION_CATEGORY_META: Record<
    NotificationCategory,
    { tone: BadgeTone; label: string }
> = {
    TRANSACTION: { tone: 'primary', label: '예약' },
    ARTWORK: { tone: 'info', label: '작품' },
    DELIVERY: { tone: 'secondary', label: '배송' },
    OPERATION: { tone: 'neutral', label: '운영' },
    ENGAGEMENT: { tone: 'success', label: '리뷰' },
};
