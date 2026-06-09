import { formatKoreanMonthDayWithWeekday } from '@todam/shared';
import { RightIcon } from '@todam/ui';

export interface PendingReservationDateCardProps {
    date: string; // YYYY-MM-DD
    reservationCount: number;
    onClick?: () => void;
}

// 대기 중인 예약 — 날짜별 집계 카드. 날짜(굵게) + N건 + chevron.
export function PendingReservationDateCard({
    date,
    reservationCount,
    onClick,
}: PendingReservationDateCardProps) {
    const label = formatKoreanMonthDayWithWeekday(date);

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full cursor-pointer items-center rounded-2xl border border-border-subtle bg-surface p-4 text-left transition-colors hover:bg-muted"
        >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-lg font-bold leading-6 text-foreground">{label}</span>
                <span className="text-xs font-normal leading-4 text-foreground-tertiary">
                    {reservationCount}건
                </span>
            </div>
            <RightIcon size={24} className="shrink-0 text-foreground-tertiary" />
        </button>
    );
}
