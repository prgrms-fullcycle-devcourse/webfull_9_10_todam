'use client';

import type { CalendarData, CalendarDay } from '@todam/shared';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, format } from 'date-fns';
import { useState } from 'react';
import { Checkbox } from '@todam/ui';

import { CalendarItem } from './CalendarItem';
import type { CalendarItemState } from './CalendarItem';

// ─── 상수 ───────────────────────────────────────────────────────────────────

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

// 연도 선택 범위: 현재 ±5년
const YEAR_RANGE = 5;

// ─── state 계산 ─────────────────────────────────────────────────────────────

function resolveState(day: CalendarDay, dateObj: Date): CalendarItemState {
    if (isToday(dateObj)) return 'today';
    if (day.isUnavailable || day.hasRestriction) return 'partiallyBlocked';
    // API 연동 시: 슬롯 없음(정기휴무) → 'holiday'
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
                className="flex items-center gap-1 text-base font-semibold text-foreground"
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
    const [filterUnavailable, setFilterUnavailable] = useState(false);
    const [filterRestriction, setFilterRestriction] = useState(false);

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
        <div className="flex flex-col gap-4">
            {/* 헤더: 연월 드롭다운 */}
            <div className="px-1">
                <YearMonthPicker year={data.year} month={data.month} onChange={onMonthChange} />
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1">
                {DOW_LABELS.map((label, idx) => (
                    <div
                        key={label}
                        className={[
                            'text-center text-xs font-medium',
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
            <div className="grid grid-cols-7 gap-1">
                {/* 앞 빈 셀 */}
                {Array.from({ length: leadingEmpties }, (_, i) => (
                    <CalendarItem key={`lead-${i}`} day={0} state="available" dow={i} empty />
                ))}

                {/* 날짜 셀 */}
                {daysInMonth.map((dateObj) => {
                    const dateStr = format(dateObj, 'yyyy-MM-dd');
                    const calDay = dayMap.get(dateStr);
                    const dow = getDay(dateObj);

                    // 필터 강조: filterUnavailable/filterRestriction 켰을 때 해당 날짜 강조(ring)
                    // — 해당 마커가 없는 날짜는 opacity 낮춤
                    const dimmed =
                        (filterUnavailable && !filterRestriction && calDay
                            ? !calDay.isUnavailable
                            : false) ||
                        (filterRestriction && !filterUnavailable && calDay
                            ? !calDay.hasRestriction
                            : false) ||
                        (filterUnavailable && filterRestriction && calDay
                            ? !calDay.isUnavailable && !calDay.hasRestriction
                            : false);

                    const state: CalendarItemState = calDay
                        ? resolveState(calDay, dateObj)
                        : 'available';

                    return (
                        <div
                            key={dateStr}
                            className={[
                                'transition-opacity',
                                (filterUnavailable || filterRestriction) && dimmed
                                    ? 'opacity-30'
                                    : 'opacity-100',
                            ].join(' ')}
                        >
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
                    <CalendarItem
                        key={`trail-${i}`}
                        day={0}
                        state="available"
                        dow={(leadingEmpties + daysInMonth.length + i) % 7}
                        empty
                    />
                ))}
            </div>

            {/* 범례 체크박스 */}
            <div className="flex flex-col gap-2 pt-1">
                <CheckboxInput
                    label="예약 불가"
                    checked={filterUnavailable}
                    onCheckedChange={setFilterUnavailable}
                />
                <CheckboxInput
                    label="신규 예약 제한"
                    checked={filterRestriction}
                    onCheckedChange={setFilterRestriction}
                />
            </div>
        </div>
    );
}

// ─── 인라인 CheckboxInput (label만 필요한 간단 래퍼) ─────────────────────────

interface CheckboxInputProps {
    label: string;
    checked: boolean;
    onCheckedChange: (v: boolean) => void;
}

function CheckboxInput({ label, checked, onCheckedChange }: CheckboxInputProps) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className="flex items-center gap-2 text-sm text-foreground-secondary"
        >
            <Checkbox checked={checked} aria-hidden tabIndex={-1} className="pointer-events-none" />
            {label}
        </button>
    );
}
