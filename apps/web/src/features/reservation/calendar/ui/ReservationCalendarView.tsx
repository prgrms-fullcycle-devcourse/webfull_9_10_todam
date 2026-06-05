'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { format, isBefore, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@todam/ui';

import { mockCalendarData, getMockReservationsByDate } from '../mock';
import { MonthCalendar } from './MonthCalendar';
import { ReservationListCard } from './ReservationListCard';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function todayStr(): string {
    return format(new Date(), 'yyyy-MM-dd');
}

/** "6월 1일 (월)" 형태 */
function formatSelectedDate(dateStr: string): string {
    const d = new Date(dateStr);
    return format(d, 'M월 d일 (EEE)', { locale: ko });
}

/** 과거 날짜 여부 */
function isPastDate(dateStr: string): boolean {
    return isBefore(startOfDay(new Date(dateStr)), startOfDay(new Date()));
}

// ─── ReservationCalendarView ──────────────────────────────────────────────────

export function ReservationCalendarView() {
    const router = useRouter();

    // 현재 연/월 (mock은 2026-06 고정)
    const [year, setYear] = useState(mockCalendarData.year);
    const [month, setMonth] = useState(mockCalendarData.month);

    // 선택 날짜: 초기값 = 오늘 또는 mock 월 1일
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = todayStr();
        // 오늘이 mock 캘린더 월에 속하면 오늘, 아니면 mock 월 1일
        const mockMonthPrefix = `${mockCalendarData.year}-${String(mockCalendarData.month).padStart(2, '0')}`;
        return today.startsWith(mockMonthPrefix)
            ? today
            : `${mockCalendarData.year}-${String(mockCalendarData.month).padStart(2, '0')}-01`;
    });

    // API 연동 시: year/month 변경 시 실제 캘린더 데이터 fetch
    // 현재는 mock만 사용하므로 year/month state는 드롭다운 표시 용도
    const handleMonthChange = (y: number, m: number) => {
        setYear(y);
        setMonth(m);
        // 선택 날짜도 해당 월 1일로 리셋
        setSelectedDate(`${y}-${String(m).padStart(2, '0')}-01`);
    };

    // mock 캘린더 데이터 (year/month에 맞게 — API 연동 시 교체)
    // mock은 2026-06 고정, 다른 월은 days 없음을 흉내
    const calendarData =
        year === mockCalendarData.year && month === mockCalendarData.month
            ? mockCalendarData
            : { year, month, days: [] };

    // 일별 예약 목록
    const listData = getMockReservationsByDate(selectedDate);
    const reservations = listData.reservations;

    // 예약 제한 버튼 노출 조건
    const isPast = isPastDate(selectedDate);
    // API 연동 시: 선택 날짜가 휴무일(정기휴무)이면 버튼 hidden — 지금은 mock에 휴무 없음
    // const isHoliday = false; // → holiday CalendarItem state와 연계

    return (
        <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
            {/* 월간 캘린더 */}
            <MonthCalendar
                data={calendarData}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onMonthChange={handleMonthChange}
            />

            {/* 일별 헤더: 날짜 + 건수 + 신규 예약 등록 버튼 */}
            <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                    <span className="text-base font-semibold text-foreground">
                        {formatSelectedDate(selectedDate)}
                    </span>
                    <span className="text-sm text-foreground-tertiary">
                        {reservations.length}건
                    </span>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                        // 신규 예약 등록 stub — 예약 등록 화면 미구현(범위 3)
                        router.push('/partner/reservations/new');
                    }}
                >
                    + 신규 예약
                </Button>
            </div>

            {/* 예약 목록 or 빈 상태 */}
            {reservations.length > 0 ? (
                <ul className="flex flex-col gap-2">
                    {reservations.map((r) => (
                        <li key={r.id}>
                            <ReservationListCard
                                reservation={r}
                                onClick={() => router.push(`/partner/reservations/${r.id}`)}
                            />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex items-center justify-center py-12 text-sm text-foreground-tertiary">
                    예약 내역이 없습니다.
                </div>
            )}

            {/* 예약 제한 버튼 */}
            {/* 휴무일(API 연동 시 holiday state 날짜)이면 hidden */}
            <div className="flex flex-col gap-1">
                <Button
                    variant="outline"
                    disabled={isPast}
                    onClick={() => router.push('/partner/reservations/restrict')}
                >
                    예약 제한
                </Button>
                {isPast && (
                    <p className="text-center text-xs text-foreground-tertiary">
                        미래 날짜만 예약을 제한할 수 있어요
                    </p>
                )}
            </div>
        </div>
    );
}
