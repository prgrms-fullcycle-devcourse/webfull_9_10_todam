'use client';

import { format } from 'date-fns';
import { Tag } from '@todam/ui';

import type { ReservationItem, ReservationStatus } from '../mock';

// ─── 상태 라벨·색상 매핑 ───────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReservationStatus, { label: string; className: string }> = {
    CONFIRMED: {
        label: '확정',
        className: 'bg-success-subtle text-success-darker',
    },
    PENDING: {
        label: '대기',
        className: 'bg-warning-subtle text-warning-darker',
    },
    CANCELED: {
        label: '취소',
        className: 'bg-muted text-foreground-tertiary',
    },
    COMPLETED: {
        label: '체험완료',
        className: 'bg-muted text-foreground-tertiary',
    },
    REJECTED: {
        label: '거절',
        className: 'bg-danger-subtle text-danger-darker',
    },
};

// ─── ReservationListCard ──────────────────────────────────────────────────────

export interface ReservationListCardProps {
    reservation: ReservationItem;
    onClick?: () => void;
}

export function ReservationListCard({ reservation, onClick }: ReservationListCardProps) {
    const { programTitle, scheduledAt, reserverName, participantCount, status } = reservation;

    const timeStr = format(new Date(scheduledAt), 'HH:mm');
    const participantLabel =
        participantCount > 1 ? `${reserverName} 외 ${participantCount - 1}명` : reserverName;

    const statusConfig = STATUS_CONFIG[status];

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3 text-left transition-colors hover:bg-muted"
        >
            {/* 좌측: 시각 + 프로그램명 + 예약자 */}
            <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-foreground-tertiary">{timeStr}</span>
                <span className="truncate text-sm font-medium text-foreground">{programTitle}</span>
                <span className="text-xs text-foreground-secondary">{participantLabel}</span>
            </div>

            {/* 우측: 상태 Tag */}
            <Tag className={['shrink-0', statusConfig.className].join(' ')}>
                {statusConfig.label}
            </Tag>
        </button>
    );
}
