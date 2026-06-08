'use client';

import { formatDateKey, type CalendarData, type CalendarDay } from '@todam/shared';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns';
import { useState } from 'react';

import { CalendarItem } from './CalendarItem';
import type { CalendarItemState } from './CalendarItem';

// ─── 상수 ───────────────────────────────────────────────────────────────────

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

// 연도 선택 범위: 현재 ±5년
const YEAR_RANGE = 5;

// ─── state 계산 ─────────────────────────────────────────────────────────────

function resolveState(day: CalendarDay, dateObj: Date): CalendarItemState {
    if (day.hasRestriction) return 'partiallyBlocked';
    if (day.isUnavailable) return 'holiday';
    if (isToday(dateObj)) return 'today';
    return 'available';
}

// ─── 연/월 드롭다운 ──────────────────────────────────────────────────────────

interface YearMonthPickerProps {
    year: number;
    month: number; // 1-12
    onChange: (year: number, month: number) => void;
}

function YearMonthPicker({ year, month, onChange }: YearMonthPickerProps) {
    const [open, setOpen] = useState(false);
    const currentYear = new Date().getFullYear();
    const years = Array.from(
        { length: YEAR_RANGE * 2 + 1 },
        (_, i) => currentYear - YEAR_RANGE + i,
    );
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex h-8 items-center gap-1 text-2xl font-semibold leading-8 text-foreground"
            >
                <span>
                    {year}년 {month}월
                </span>
                {/* chevron down */}
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                    className={['transition-transform', open ? 'rotate-180' : ''].join(' ')}
                >
                    <path
                        d="M4 6l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {open && (
                <div
                    className="absolute left-0 top-full z-10 mt-1 flex max-h-64 overflow-auto rounded-xl border border-border-subtle bg-surface shadow-md"
                    onMouseLeave={() => setOpen(false)}
                >
                    {/* 연도 */}
                    <ul className="min-w-16 border-r border-border-subtle py-1">
                        {years.map((y) => (
                            <li key={y}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(y, month);
                                        setOpen(false);
                                    }}
                                    className={[
                                        'w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted',
                                        y === year
                                            ? 'font-semibold text-primary'
                                            : 'text-foreground-secondary',
                                    ].join(' ')}
                                >
                                    {y}년
                                </button>
                            </li>
                        ))}
                    </ul>
                    {/* 월 */}
                    <ul className="min-w-12 py-1">
                        {months.map((m) => (
                            <li key={m}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(year, m);
                                        setOpen(false);
                                    }}
                                    className={[
                                        'w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted',
                                        m === month
                                            ? 'font-semibold text-primary'
                                            : 'text-foreground-secondary',
                                    ].join(' ')}
                                >
                                    {m}월
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ─── MonthCalendar ────────────────────────────────────────────────────────────

export interface MonthCalendarProps {
    data: CalendarData;
    selectedDate: string | null; // YYYY-MM-DD
    onSelectDate: (date: string) => void;
    onMonthChange: (year: number, month: number) => void;
}

export function MonthCalendar({
    data,
    selectedDate,
    onSelectDate,
    onMonthChange,
}: MonthCalendarProps) {
    // 해당 월의 모든 날짜 구간 계산
    const monthStart = new Date(data.year, data.month - 1, 1);
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // 앞쪽 빈 셀 (일요일 기준)
    const leadingEmpties = getDay(startOfMonth(monthStart)); // 0=일

    // CalendarDay map
    const dayMap = new Map<string, CalendarDay>(data.days.map((d) => [d.date, d]));

    // 전체 셀 배열: 빈 셀 + 날짜 셀
    const totalCells = leadingEmpties + daysInMonth.length;
    const trailingEmpties = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

    return (
        <div className="flex min-w-0 flex-col gap-3 py-2">
            {/* 헤더: 연월 드롭다운 */}
            <div className="flex h-14 items-center">
                <YearMonthPicker year={data.year} month={data.month} onChange={onMonthChange} />
            </div>

            {/* 요일 헤더 */}
            <div className="grid h-6 min-w-0 grid-cols-7 gap-1">
                {DOW_LABELS.map((label, idx) => (
                    <div
                        key={label}
                        className={[
                            'flex items-start justify-center pt-0.5 text-xs font-normal leading-4',
                            idx === 0
                                ? 'text-danger'
                                : idx === 6
                                  ? 'text-info'
                                  : 'text-foreground-tertiary',
                        ].join(' ')}
                    >
                        {label}
                    </div>
                ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid min-w-0 grid-cols-7 gap-1">
                {/* 앞 빈 셀 */}
                {Array.from({ length: leadingEmpties }, (_, i) => (
                    <div key={`lead-${i}`} className="min-w-0">
                        <CalendarItem day={0} state="available" dow={i} empty />
                    </div>
                ))}

                {/* 날짜 셀 */}
                {daysInMonth.map((dateObj) => {
                    const dateStr = formatDateKey(dateObj);
                    const calDay = dayMap.get(dateStr);
                    const dow = getDay(dateObj);

                    const state: CalendarItemState = calDay
                        ? resolveState(calDay, dateObj)
                        : 'available';

                    return (
                        <div key={dateStr} className="min-w-0">
                            <CalendarItem
                                day={dateObj.getDate()}
                                state={state}
                                hasReservation={calDay?.hasReservation ?? false}
                                dow={dow}
                                selected={selectedDate === dateStr}
                                onClick={() => onSelectDate(dateStr)}
                            />
                        </div>
                    );
                })}

                {/* 뒤 빈 셀 */}
                {Array.from({ length: trailingEmpties }, (_, i) => (
                    <div key={`trail-${i}`} className="min-w-0">
                        <CalendarItem
                            day={0}
                            state="available"
                            dow={(leadingEmpties + daysInMonth.length + i) % 7}
                            empty
                        />
                    </div>
                ))}
            </div>

            <div className="flex h-8 items-center justify-end gap-3 py-2">
                <LegendItem label="예약 불가" swatchClassName="border-border-subtle" />
                <LegendItem label="신규 예약 제한" swatchClassName="border-border bg-muted" />
            </div>
        </div>
    );
}

interface LegendItemProps {
    label: string;
    swatchClassName: string;
}

function LegendItem({ label, swatchClassName }: LegendItemProps) {
    return (
        <div className="flex items-center gap-1">
            <span className={['size-3 rounded-xs border', swatchClassName].join(' ')} />
            <span className="text-xs font-normal leading-4 text-foreground-tertiary">{label}</span>
        </div>
    );
}
