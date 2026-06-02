'use client';

import { formatScheduled, type ReservationListItem } from '@todam/shared';

import { ReservationStatusBadge } from '@/entities/reservation';

// status message UI 숨김 조건.
// 1) 정본 명세: DELIVERED/PICKUP_DONE 종료 상태 카드는 status message frame 자체 hidden.
// 2) displayState.description 이 비어있는 경우(=서버가 메시지 없음 의도).
function shouldHideStatusMessage(item: ReservationListItem): boolean {
    if (item.status === 'DELIVERED' || item.status === 'PICKUP_DONE') return true;
    return !item.displayState.description.trim();
}

export type ReservationCardProps = {
    item: ReservationListItem;
    onClick?: () => void;
};

export function ReservationCard({ item, onClick }: ReservationCardProps) {
    const { date, day, time } = formatScheduled(item.scheduledAt);
    const hideMessage = shouldHideStatusMessage(item);

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-4 text-left"
        >
            <div className="flex flex-col gap-2">
                {/* 행 1: date·day + 우측 배지 */}
                <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center gap-1">
                        <span className="text-base font-semibold text-foreground">{date}</span>
                        <span className="text-base text-foreground-tertiary">{day}</span>
                    </div>
                    <ReservationStatusBadge status={item.status} label={item.displayState.label} />
                </div>

                {/* 행 2: programTitle + meta(category・storeName・hh:mm) */}
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">{item.programTitle}</p>
                    <p className="text-xs text-foreground-tertiary">
                        {item.category}・{item.storeName}・{time}
                    </p>
                </div>
            </div>

            {/* 행 3: status message (옵션). displayState.description 그대로 렌더. */}
            {!hideMessage && (
                <div className="flex h-8 items-center rounded-lg bg-muted px-3">
                    <p className="text-xs font-semibold text-foreground-secondary">
                        {item.displayState.description}
                        {item.displayState.subLabel ? ` · ${item.displayState.subLabel}` : ''}
                    </p>
                </div>
            )}
        </button>
    );
}
