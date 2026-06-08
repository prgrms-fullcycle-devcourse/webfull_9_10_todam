'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button, PlusIcon, SectionTitle } from '@todam/ui';
import { formatKoreanMonthDayWithWeekday, getTodayDateKey, isFutureDateKey } from '@todam/shared';

import {
    usePartnerReservationCalendar,
    usePartnerReservationsByDate,
} from '@/entities/reservation';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';

import { MonthCalendar } from './MonthCalendar';
import { ReservationManagementCardItem } from './ReservationManagementCardItem';

// ─── ReservationCalendarView ──────────────────────────────────────────────────

interface ReservationCalendarViewProps {
    storeId: string;
}

function emptyCalendarData(year: number, month: number) {
    return { year, month, days: [] };
}

function emptyReservationListData() {
    return { reservations: [], nextCursor: null, hasMore: false };
}

export function ReservationCalendarView({ storeId }: ReservationCalendarViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const today = getTodayDateKey();
    const initialDate = searchParams.get('date') ?? today;
    const currentYear = Number(today.slice(0, 4));
    const currentMonth = Number(today.slice(5, 7));

    const [year, setYear] = useState(Number(initialDate.slice(0, 4)) || currentYear);
    const [month, setMonth] = useState(Number(initialDate.slice(5, 7)) || currentMonth);

    const [selectedDate, setSelectedDate] = useState<string>(initialDate);

    useHeaderOverride({
        rightAction: (
            <Button
                variant="ghost"
                layout="onlyIcon"
                size="lg"
                icon={<PlusIcon />}
                aria-label="신규 예약"
                onClick={() => router.push(`/partner/reservations/new?date=${selectedDate}`)}
                className="hover:!bg-transparent hover:!text-foreground"
            />
        ),
    });

    const calendarQuery = usePartnerReservationCalendar(storeId, year, month);
    const reservationsQuery = usePartnerReservationsByDate(storeId, selectedDate);

    const handleMonthChange = (y: number, m: number) => {
        setYear(y);
        setMonth(m);
        setSelectedDate(`${y}-${String(m).padStart(2, '0')}-01`);
    };

    const calendarData = calendarQuery.data ?? emptyCalendarData(year, month);

    const listData = reservationsQuery.data ?? emptyReservationListData();
    const reservations = listData.reservations;

    const selectedDay = calendarData.days.find((day) => day.date === selectedDate);
    const isSelectedHoliday = Boolean(selectedDay?.isUnavailable && !selectedDay.hasRestriction);
    const canRestrictReservation = isFutureDateKey(selectedDate);

    return (
        <main className="flex-1 overflow-y-auto px-4 pb-16">
            {/* 월간 캘린더 */}
            <MonthCalendar
                data={calendarData}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onMonthChange={handleMonthChange}
            />

            <div className="flex min-w-0 flex-col gap-2 py-2">
                <SectionTitle
                    size="md"
                    title={formatKoreanMonthDayWithWeekday(selectedDate)}
                    subText={
                        reservationsQuery.isFetching ? '불러오는 중' : `${reservations.length}건`
                    }
                />

                {reservations.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                        {reservations.map((r) => (
                            <li key={r.id}>
                                <ReservationManagementCardItem
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

                {!isSelectedHoliday && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={!canRestrictReservation}
                        onClick={() =>
                            router.push(`/partner/reservations/restrict?date=${selectedDate}`)
                        }
                    >
                        {canRestrictReservation
                            ? '예약 제한'
                            : '미래 날짜만 예약을 제한할 수 있어요'}
                    </Button>
                )}
            </div>
        </main>
    );
}
