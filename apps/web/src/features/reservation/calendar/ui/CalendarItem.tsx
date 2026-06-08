'use client';

/**
 * CalendarItem — 월간 캘린더 날짜 셀 컴포넌트
 *
 * state 매핑 (mock/API 기준):
 *   - 오늘 날짜 → today (우선순위 최상)
 *   - isUnavailable || hasRestriction → partiallyBlocked
 *   - 정기휴무(슬롯 없음, 별도 prop) → holiday
 *   - 그 외 → available
 *   hasReservation=true 이면 날짜 아래 4px dot 표시
 *
 * 토큰: semantic.css 기준 (raw hex 금지)
 *   - available: bg-surface border-border-subtle text-foreground
 *   - partiallyBlocked: bg-muted border-border text-foreground
 *   - holiday: bg-transparent border-border-subtle text-foreground-tertiary
 *   - today: bg-secondary-subtle border-border-subtle text-foreground
 *   - dot: bg-warning
 */

export type CalendarItemState = 'available' | 'partiallyBlocked' | 'holiday' | 'today';

export interface CalendarItemProps {
    /** 날짜 숫자 (1–31) */
    day: number;
    /** CalendarItem 상태 variant */
    state: CalendarItemState;
    /** 예약 있음 dot 표시 여부 */
    hasReservation?: boolean;
    /** 요일 인덱스 (0=일, 6=토) — 날짜 텍스트 색에 사용 */
    dow: number;
    /** 선택된 날짜인지 */
    selected?: boolean;
    /** 빈 셀(이전/다음 달 패딩) */
    empty?: boolean;
    /** 클릭 핸들러 */
    onClick?: () => void;
}

const stateBase: Record<CalendarItemState, string> = {
    available: 'bg-surface border border-border-subtle',
    partiallyBlocked: 'bg-muted border border-border',
    holiday: 'bg-transparent border border-border-subtle',
    today: 'bg-secondary-subtle border border-border-subtle',
};

export function CalendarItem({
    day,
    state,
    hasReservation = false,
    dow,
    selected = false,
    empty = false,
    onClick,
}: CalendarItemProps) {
    if (empty) {
        return <div className="h-14 rounded-lg" />;
    }

    const dowTextColor =
        state === 'holiday'
            ? 'text-foreground-tertiary'
            : dow === 0
              ? 'text-danger'
              : dow === 6
                ? 'text-info'
                : 'text-foreground';

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'flex h-14 w-full flex-col items-center rounded-lg pb-2 pt-[18px] transition-colors cursor-pointer',
                stateBase[state],
                selected ? 'ring-2 ring-secondary-darker' : 'hover:ring-1 hover:ring-border',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <span className={['text-base font-normal leading-5', dowTextColor].join(' ')}>
                {day}
            </span>
            {/* dot: 4px = size-1 */}
            <span
                className={[
                    'mt-1.5 size-1 shrink-0 aspect-square rounded-full transition-opacity',
                    hasReservation ? 'bg-warning opacity-100' : 'opacity-0',
                ].join(' ')}
            />
        </button>
    );
}
