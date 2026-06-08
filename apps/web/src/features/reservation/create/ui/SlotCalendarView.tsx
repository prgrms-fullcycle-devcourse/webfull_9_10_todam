'use client';

import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay, isToday } from 'date-fns';
import { useState } from 'react';

import type { AvailableSlotItem } from '@todam/shared';
import { StoreTimeSlotStatus } from '@todam/shared';

// ─── 상수 ────────────────────────────────────────────────────────────────────

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const YEAR_RANGE = 5;

// ─── 연/월 드롭다운 ───────────────────────────────────────────────────────────

interface YearMonthPickerProps {
    year: number;
    month: number;
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

// ─── 날짜 셀 컴포넌트 ─────────────────────────────────────────────────────────

interface DayCellProps {
    dateObj: Date;
    hasAvailable: boolean;
    selected: boolean;
    empty?: boolean;
    dow: number;
    onClick: () => void;
}

function DayCell({ dateObj, hasAvailable, selected, empty, dow, onClick }: DayCellProps) {
    if (empty) {
        return <div className="aspect-square rounded-lg" />;
    }
    const today = isToday(dateObj);
    const day = dateObj.getDate();

    const bgClass = today
        ? 'bg-secondary-subtle border border-secondary-lighter'
        : 'bg-surface border border-border-subtle';

    const textClass = today
        ? 'text-secondary-darker'
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
                'flex flex-col items-center justify-center gap-0.5 rounded-lg aspect-square transition-colors',
                bgClass,
                selected ? 'ring-2 ring-primary ring-offset-1' : 'hover:ring-1 hover:ring-border',
            ].join(' ')}
        >
            <span className={['text-xs font-medium leading-none', textClass].join(' ')}>{day}</span>
            {/* 예약 가능 슬롯 있음 dot */}
            <span
                className={[
                    'size-1 rounded-full transition-opacity',
                    hasAvailable ? 'bg-primary opacity-100' : 'opacity-0',
                ].join(' ')}
            />
        </button>
    );
}

// ─── 슬롯 목록 (선택된 날짜의 시간대) ─────────────────────────────────────────

interface SlotItemProps {
    slot: AvailableSlotItem;
    selected: boolean;
    onSelect: () => void;
}

function SlotItem({ slot, selected, onSelect }: SlotItemProps) {
    const startTime = format(new Date(slot.startAt), 'HH:mm');
    const endTime = format(new Date(slot.endAt), 'HH:mm');
    const isSelectable = slot.isAvailable;
    const isClosed =
        slot.status === StoreTimeSlotStatus.CLOSED ||
        slot.status === StoreTimeSlotStatus.CANCELED ||
        !slot.isAvailable;

    return (
        <button
            type="button"
            disabled={isClosed}
            onClick={isSelectable ? onSelect : undefined}
            className={[
                'flex items-center justify-between w-full rounded-xl border px-4 py-3 text-sm transition-colors',
                isClosed
                    ? 'bg-muted border-border text-foreground-tertiary cursor-not-allowed'
                    : selected
                      ? 'bg-primary-subtle border-primary text-primary font-semibold'
                      : 'bg-surface border-border-subtle text-foreground hover:border-primary',
            ].join(' ')}
        >
            <span>
                {startTime} – {endTime}
            </span>
            <span className="text-xs">
                {isClosed ? (
                    <span className="text-foreground-tertiary">예약 불가</span>
                ) : (
                    <span className={selected ? 'text-primary' : 'text-foreground-secondary'}>
                        잔여 {slot.remainingCount}명
                    </span>
                )}
            </span>
        </button>
    );
}

// ─── SlotCalendarView ─────────────────────────────────────────────────────────

export interface SlotCalendarViewProps {
    year: number;
    month: number;
    slots: AvailableSlotItem[];
    selectedSlotId: string | null;
    onMonthChange: (year: number, month: number) => void;
    onSlotSelect: (slot: AvailableSlotItem) => void;
}

export function SlotCalendarView({
    year,
    month,
    slots,
    selectedSlotId,
    onMonthChange,
    onSlotSelect,
}: SlotCalendarViewProps) {
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
        return today.startsWith(monthPrefix) ? today : `${monthPrefix}-01`;
    });

    // 선택된 날짜의 슬롯 목록 (날짜 기준 필터링 — UTC ISO -> 로컬 날짜 비교)
    const slotsForDate = slots.filter((s) => {
        const slotDate = format(new Date(s.startAt), 'yyyy-MM-dd');
        return slotDate === selectedDate;
    });

    // 날짜별 available 여부 맵
    const availableByDate = new Map<string, boolean>();
    for (const s of slots) {
        const d = format(new Date(s.startAt), 'yyyy-MM-dd');
        if (s.isAvailable) availableByDate.set(d, true);
    }

    // 달력 그리드 계산
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const leadingEmpties = getDay(startOfMonth(monthStart));
    const totalCells = leadingEmpties + daysInMonth.length;
    const trailingEmpties = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

    const handleMonthChange = (y: number, m: number) => {
        onMonthChange(y, m);
        const newPrefix = `${y}-${String(m).padStart(2, '0')}`;
        const today = format(new Date(), 'yyyy-MM-dd');
        setSelectedDate(today.startsWith(newPrefix) ? today : `${newPrefix}-01`);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* 연월 드롭다운 */}
            <div className="px-1">
                <YearMonthPicker year={year} month={month} onChange={handleMonthChange} />
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
                {Array.from({ length: leadingEmpties }, (_, i) => (
                    <DayCell
                        key={`lead-${i}`}
                        dateObj={new Date(year, month - 1, 0)}
                        hasAvailable={false}
                        selected={false}
                        dow={i}
                        empty
                        onClick={() => {}}
                    />
                ))}
                {daysInMonth.map((dateObj) => {
                    const dateStr = format(dateObj, 'yyyy-MM-dd');
                    const dow = getDay(dateObj);
                    return (
                        <DayCell
                            key={dateStr}
                            dateObj={dateObj}
                            hasAvailable={availableByDate.get(dateStr) ?? false}
                            selected={selectedDate === dateStr}
                            dow={dow}
                            onClick={() => setSelectedDate(dateStr)}
                        />
                    );
                })}
                {Array.from({ length: trailingEmpties }, (_, i) => (
                    <DayCell
                        key={`trail-${i}`}
                        dateObj={new Date(year, month - 1, 0)}
                        hasAvailable={false}
                        selected={false}
                        dow={(leadingEmpties + daysInMonth.length + i) % 7}
                        empty
                        onClick={() => {}}
                    />
                ))}
            </div>

            {/* 선택된 날짜의 슬롯 목록 */}
            <div className="flex flex-col gap-2 pt-2">
                <p className="text-sm font-semibold text-foreground">
                    {format(new Date(selectedDate), 'M월 d일')} 시간 선택
                </p>
                {slotsForDate.length === 0 ? (
                    <p className="text-sm text-foreground-tertiary py-4 text-center">
                        해당 날짜에 예약 가능한 슬롯이 없습니다.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {slotsForDate.map((slot) => (
                            <li key={slot.slotId}>
                                <SlotItem
                                    slot={slot}
                                    selected={selectedSlotId === slot.slotId}
                                    onSelect={() => onSlotSelect(slot)}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
