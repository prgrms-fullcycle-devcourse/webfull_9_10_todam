'use client';

import { useState } from 'react';
import { BottomBar, Button, CheckboxInput, DescriptionBlock, SparkleIcon } from '@todam/ui';
import {
    formatKoreanMonthDayWithWeekday,
    formatScheduled,
    toKSTOffsetISO,
    type TimeSlotItem,
} from '@todam/shared';

import { usePartnerTimeSlotsByDate } from '@/entities/reservation';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';

function timeRange(slot: Pick<TimeSlotItem, 'startAt' | 'endAt'>): string {
    return `${formatScheduled(slot.startAt).time} ~ ${formatScheduled(slot.endAt).time}`;
}

type SelectedTimeRange = {
    startAt: string;
    endAt: string;
};

type Props = {
    storeId: string;
    date: string;
    initialSelectedSlotKeys?: string[];
    onUnrestrict?: () => void;
    unrestrictPending?: boolean;
    onBack: () => void;
    onNext: (selectedSlotKeys: string[], timeRanges: SelectedTimeRange[]) => void;
};

export function RestrictionTimeSlotsClient({
    storeId,
    date,
    initialSelectedSlotKeys = [],
    onUnrestrict,
    unrestrictPending = false,
    onBack,
    onNext,
}: Props) {
    const [selectedSlotKeys, setSelectedSlotKeys] = useState<Set<string>>(
        () => new Set(initialSelectedSlotKeys),
    );

    const timeSlotsQuery = usePartnerTimeSlotsByDate(storeId, date);
    const slots = timeSlotsQuery.data?.slots ?? [];

    const allSelected = slots.length > 0 && selectedSlotKeys.size === slots.length;
    const totalConfirmedCount = slots.reduce((sum, s) => sum + s.confirmedReservationCount, 0);

    useHeaderOverride({
        title: '예약 제한 시간대 선택',
        hideRightAction: true,
        onBack,
    });

    const toggleAll = () => {
        if (allSelected) {
            setSelectedSlotKeys(new Set());
        } else {
            setSelectedSlotKeys(new Set(slots.map((s) => s.slotKey)));
        }
    };

    const toggleSlot = (slotKey: string) => {
        setSelectedSlotKeys((prev) => {
            const next = new Set(prev);
            if (next.has(slotKey)) {
                next.delete(slotKey);
            } else {
                next.add(slotKey);
            }
            return next;
        });
    };

    const handleNext = () => {
        const selected = slots.filter((s) => selectedSlotKeys.has(s.slotKey));
        const timeRanges = selected.map((s) => ({
            startAt: toKSTOffsetISO(s.startAt),
            endAt: toKSTOffsetISO(s.endAt),
        }));
        onNext(Array.from(selectedSlotKeys), timeRanges);
    };

    return (
        <>
            <main className="flex-1 overflow-y-auto px-4 pb-28">
                <section className="flex flex-col gap-3 py-2">
                    <div className="flex flex-col gap-2 py-2">
                        <h1 className="text-2xl font-bold text-foreground">
                            {formatKoreanMonthDayWithWeekday(date)}
                        </h1>
                        <p className="text-xs font-medium text-foreground-tertiary">
                            신규 예약을 제한할 클래스를 선택해 주세요.
                        </p>
                    </div>
                    <DescriptionBlock type="warn" title="예약 제한 안내" icon={<SparkleIcon />}>
                        이미 확정된 예약은 취소되지 않고 유지돼요. 예약 제한 설정 완료 시점부터 신규
                        예약을 할 수 없어요.
                    </DescriptionBlock>
                </section>

                <section className="flex flex-col gap-3 py-2">
                    {timeSlotsQuery.isLoading ? (
                        <p className="py-10 text-center text-sm text-foreground-tertiary">
                            시간대를 불러오는 중입니다.
                        </p>
                    ) : slots.length === 0 ? (
                        <p className="py-10 text-center text-sm text-foreground-tertiary">
                            해당 날짜에 시간대가 없습니다.
                        </p>
                    ) : (
                        <>
                            <CheckboxInput
                                label="모든 시간대 선택"
                                checked={allSelected}
                                onCheckedChange={toggleAll}
                                action={
                                    totalConfirmedCount > 0 ? (
                                        <span className="shrink-0 text-sm font-semibold text-primary">
                                            확정 예약 총 {totalConfirmedCount}건
                                        </span>
                                    ) : undefined
                                }
                            />
                            {slots.map((slot) => (
                                <CheckboxInput
                                    key={slot.slotKey}
                                    label={timeRange(slot)}
                                    checked={selectedSlotKeys.has(slot.slotKey)}
                                    onCheckedChange={() => toggleSlot(slot.slotKey)}
                                    action={
                                        slot.confirmedReservationCount > 0 ? (
                                            <span className="shrink-0 text-sm text-primary">
                                                확정 예약 {slot.confirmedReservationCount}건
                                            </span>
                                        ) : undefined
                                    }
                                />
                            ))}
                        </>
                    )}
                </section>
            </main>

            <BottomBar>
                <Button
                    size="lg"
                    className="w-full"
                    disabled={selectedSlotKeys.size === 0}
                    onClick={handleNext}
                >
                    제한 시간 선택 완료
                </Button>
                {onUnrestrict && (
                    <Button
                        variant="ghost"
                        size="lg"
                        className="w-full"
                        disabled={unrestrictPending}
                        onClick={onUnrestrict}
                    >
                        {unrestrictPending ? '해제 중' : '예약 제한 해제하기'}
                    </Button>
                )}
            </BottomBar>
        </>
    );
}
