'use client';

import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay, isToday } from 'date-fns';
import { useState } from 'react';

import { CALENDAR_YEAR_RANGE, DAYS, toKSTOffsetISO } from '@todam/shared';
import type { AvailableSlotItem } from '@todam/shared';
import { SectionTitle, Slot } from '@todam/ui';

// 당일 예약 불가 — 오늘 0시 기준, 오늘보다 큰 날짜만 선택 가능.
function startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const fmtDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 해당 월의 기본 선택일 = 첫 선택가능일.
// 현재 월이면 내일(당일 예약 불가), 그 외 월이면 1일.
function defaultDateFor(year: number, month: number): string {
    const today = startOfToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const inMonth = tomorrow.getFullYear() === year && tomorrow.getMonth() === month - 1;
    return inMonth ? fmtDate(tomorrow) : fmtDate(new Date(year, month - 1, 1));
}

// 슬롯 startAt(UTC)을 KST 기준 날짜(YYYY-MM-DD)/시각(HH:mm)으로. 브라우저 TZ 무관 고정.
// (로컬 TZ로 비교하면 자정 걸치는 슬롯이 인접일로 새어 날짜별 개수가 틀어진다.)
const slotKstDate = (startAt: string) => toKSTOffsetISO(startAt).slice(0, 10);
const slotKstTime = (startAt: string) => toKSTOffsetISO(startAt).slice(11, 16);

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
        { length: CALENDAR_YEAR_RANGE * 2 + 1 },
        (_, i) => currentYear - CALENDAR_YEAR_RANGE + i,
    );
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1 text-lg font-semibold text-foreground"
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

// ─── 날짜 셀 ──────────────────────────────────────────────────────────────────

interface DayCellProps {
    dateObj: Date;
    selected: boolean;
    disabled: boolean;
    empty?: boolean;
    dow: number;
    onClick: () => void;
}

function DayCell({ dateObj, selected, disabled, empty, dow, onClick }: DayCellProps) {
    if (empty) {
        return <div className="aspect-square" />;
    }

    const today = isToday(dateObj);
    const day = dateObj.getDate();

    const textClass = selected
        ? 'text-foreground-inverse'
        : disabled
          ? 'text-foreground-disabled'
          : dow === 0
            ? 'text-danger'
            : dow === 6
              ? 'text-info'
              : 'text-foreground';

    const boxClass = selected
        ? 'bg-inverse font-semibold'
        : today
          ? 'border border-secondary-lighter'
          : disabled
            ? ''
            : 'hover:bg-muted';

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={disabled ? undefined : onClick}
            className={[
                'flex aspect-square items-center justify-center rounded-lg text-sm transition-colors',
                disabled ? 'cursor-not-allowed' : '',
                boxClass,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <span className={['leading-none', textClass].join(' ')}>{day}</span>
        </button>
    );
}

// ─── SlotCalendarView ─────────────────────────────────────────────────────────

export interface SlotCalendarViewProps {
    year: number;
    month: number;
    slots: AvailableSlotItem[];
    selectedSlotKey: string | null;
    /** 예약 인원 — 잔여 정원이 이보다 적은 슬롯은 마감 처리(비활성). */
    participantCount: number;
    onMonthChange: (year: number, month: number) => void;
    onSlotSelect: (slot: AvailableSlotItem) => void;
}

export function SlotCalendarView({
    year,
    month,
    slots,
    selectedSlotKey,
    participantCount,
    onMonthChange,
    onSlotSelect,
}: SlotCalendarViewProps) {
    // 첫 선택가능일(현재 월=내일)을 기본 선택 → 빈 상태 없이 바로 슬롯 노출.
    const [selectedDate, setSelectedDate] = useState<string>(() => defaultDateFor(year, month));
    const todayStart = startOfToday();

    // 선택된 날짜의 슬롯 목록 (UTC ISO → KST 날짜 비교)
    const slotsForDate = slots.filter((s) => slotKstDate(s.startAt) === selectedDate);

    // 달력 그리드 계산
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const leadingEmpties = getDay(startOfMonth(monthStart));
    const totalCells = leadingEmpties + daysInMonth.length;
    const trailingEmpties = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

    const handleMonthChange = (y: number, m: number) => {
        onMonthChange(y, m);
        setSelectedDate(defaultDateFor(y, m));
    };

    return (
        <div className="flex flex-col gap-2">
            {/* 캘린더 카드 */}
            <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-4">
                <YearMonthPicker year={year} month={month} onChange={handleMonthChange} />

                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 gap-1">
                    {DAYS.map((label, idx) => (
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
                            dateObj={monthStart}
                            selected={false}
                            disabled
                            dow={i}
                            empty
                            onClick={() => {}}
                        />
                    ))}
                    {daysInMonth.map((dateObj) => {
                        const dateStr = format(dateObj, 'yyyy-MM-dd');
                        const dow = getDay(dateObj);
                        // 당일 포함 과거는 선택 불가.
                        const disabled = dateObj <= todayStart;
                        return (
                            <DayCell
                                key={dateStr}
                                dateObj={dateObj}
                                selected={selectedDate === dateStr}
                                disabled={disabled}
                                dow={dow}
                                onClick={() => setSelectedDate(dateStr)}
                            />
                        );
                    })}
                    {Array.from({ length: trailingEmpties }, (_, i) => (
                        <DayCell
                            key={`trail-${i}`}
                            dateObj={monthEnd}
                            selected={false}
                            disabled
                            dow={(leadingEmpties + daysInMonth.length + i) % 7}
                            empty
                            onClick={() => {}}
                        />
                    ))}
                </div>
            </div>

            {/* 체험 시간 */}
            <div className="flex flex-col py-2 gap-2">
                <SectionTitle size="md" title="체험 시간" />
                {slotsForDate.length === 0 ? (
                    <p className="py-4 text-center text-sm text-foreground-tertiary">
                        해당 날짜에 예약 가능한 시간이 없습니다.
                    </p>
                ) : (
                    <div className="grid grid-cols-3 gap-3">
                        {slotsForDate.map((slot) => {
                            // 마감: 슬롯 자체가 예약 불가(닫힘/정원 0)이거나, 잔여 정원이 예약 인원보다 적은 경우.
                            const full =
                                !slot.isAvailable || slot.remainingCount < participantCount;
                            return (
                                <Slot
                                    key={slot.slotKey}
                                    selected={selectedSlotKey === slot.slotKey}
                                    disabled={full}
                                    onClick={() => onSlotSelect(slot)}
                                >
                                    {slotKstTime(slot.startAt)}
                                </Slot>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
