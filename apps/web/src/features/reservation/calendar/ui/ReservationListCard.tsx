'use client';

import { ReservationStatus } from '@todam/shared';
import type { ReservationItem } from '@todam/shared';
import { format } from 'date-fns';
import { Tag } from '@todam/ui';

// ─── 상태 라벨·색상 매핑 ───────────────────────────────────────────────────
// status는 BE `ReservationStatus` enum 기준. 거절은 CANCELED로 통합(D-REJECT 잠정),
// 체험완료는 IN_PROGRESS로 표현(complete 잠정). 미매핑 enum은 DEFAULT fallback.

const DEFAULT_STATUS = { label: '확인', className: 'bg-muted text-foreground-tertiary' };

const STATUS_CONFIG: Partial<Record<ReservationStatus, { label: string; className: string }>> = {
    [ReservationStatus.CONFIRMED]: {
        label: '확정',
        className: 'bg-success-subtle text-success-darker',
    },
    [ReservationStatus.PENDING]: {
        label: '대기',
        className: 'bg-warning-subtle text-warning-darker',
    },
    [ReservationStatus.CANCELED]: {
        label: '취소',
        className: 'bg-muted text-foreground-tertiary',
    },
    [ReservationStatus.IN_PROGRESS]: {
        label: '체험완료',
        className: 'bg-muted text-foreground-tertiary',
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

    const statusConfig = STATUS_CONFIG[status] ?? DEFAULT_STATUS;

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
