'use client';

import { ReservationStatus } from '@todam/shared';
import type { ReservationItem } from '@todam/shared';
import { format } from 'date-fns';
import { Badge } from '@todam/ui';

// ─── 상태 라벨·색상 매핑 ───────────────────────────────────────────────────
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
        className: 'bg-danger-subtle text-danger-darker',
    },
    [ReservationStatus.IN_PROGRESS]: {
        label: '체험완료',
        className: 'bg-muted text-foreground-tertiary',
    },
};

// ─── ReservationManagementCardItem ───────────────────────────────────────────

export interface ReservationManagementCardItemProps {
    reservation: ReservationItem;
    onClick?: () => void;
}

export function ReservationManagementCardItem({
    reservation,
    onClick,
}: ReservationManagementCardItemProps) {
    const { programTitle, scheduledAt, reserverName, participantCount, status } = reservation;

    const startTime = format(new Date(scheduledAt), 'HH:mm');
    const duration = '2시간';
    const reservationPerson = reserverName;
    const extraParticipantLabel = participantCount > 1 ? `외 ${participantCount - 1}명` : null;

    const statusConfig = STATUS_CONFIG[status] ?? DEFAULT_STATUS;

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center rounded-2xl border border-border-subtle bg-surface p-4 text-left transition-colors hover:bg-muted"
        >
            <div className="flex h-11 w-full min-w-0 items-start">
                <div className="flex flex-col gap-1 border-r border-border-subtle pr-4">
                    <span className="text-lg font-bold leading-6 text-foreground">{startTime}</span>
                    <span className="text-xs font-normal leading-4 text-foreground-tertiary">
                        {duration}
                    </span>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1 px-4 justify-center h-full">
                    <span className="truncate text-base font-semibold leading-5 text-foreground">
                        {programTitle}
                    </span>
                    <div className="flex min-w-0 gap-1 text-xs font-normal leading-4">
                        <span className="truncate text-foreground-secondary">
                            {reservationPerson}
                        </span>
                        {extraParticipantLabel && (
                            <span className="shrink-0 text-foreground-tertiary">
                                {extraParticipantLabel}
                            </span>
                        )}
                    </div>
                </div>

                <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
            </div>
        </button>
    );
}
