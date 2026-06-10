'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InformationIcon } from '@todam/ui';
import { formatKoreanMonthDayWithWeekday, toKSTOffsetISO } from '@todam/shared';
import type { ReservationRestrictionTimeRange } from '@todam/shared';

import { useCurrentStudioId } from '@/entities/studio';
import {
    useDeletePartnerReservationRestrictionsMutation,
    usePartnerTimeSlotsByDate,
} from '@/entities/reservation';
import { useSheet, useToast } from '@/shared/model';
import { ReservationCalendarView } from '@/features/reservation/list/ui/ReservationCalendarView';

import { RestrictionScopeBottomSheet } from './RestrictionScopeBottomSheet';
import { RestrictionTimeSlotsClient } from './RestrictionTimeSlotsClient';
import { RestrictionProgramsClient } from './RestrictionProgramsClient';

type Scope = 'ALL_DAY' | 'TIME_SLOTS';
type Step = 'scope' | 'timeslots' | 'programs';

type Props = {
    date: string;
};

export function RestrictionPageClient({ date }: Props) {
    const storeId = useCurrentStudioId();
    const router = useRouter();
    const { open: openSheet, close: closeSheet } = useSheet();
    const { push: pushToast } = useToast();
    const deleteMutation = useDeletePartnerReservationRestrictionsMutation(storeId ?? '');

    const [step, setStep] = useState<Step>('scope');
    const [scope, setScope] = useState<Scope>('ALL_DAY');
    const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
    const [timeRanges, setTimeRanges] = useState<ReservationRestrictionTimeRange[]>([]);
    const [initialProgramIds, setInitialProgramIds] = useState<string[]>([]);
    // 기존 제한 있는 날 재진입 → 바텀시트 생략하고 timeslots부터(종일이었어도). 뒤로가기 동작 분기용.
    const [prefilled, setPrefilled] = useState(false);

    // 재진입 pre-fill: 기존 제한값을 time-slots(restrictedProgramIds)에서 도출해 1회 시드.
    // 전용 GET 제한 엔드포인트가 없어 슬롯별 제한 정보로 시간대/클래스를 복원한다.
    const timeSlotsQuery = usePartnerTimeSlotsByDate(storeId ?? '', date);
    const [seeded, setSeeded] = useState(false);
    // 렌더 중 1회 시드(쿼리 데이터에서 파생되는 초기 상태 — 효과보다 권장 패턴).
    if (!seeded && timeSlotsQuery.data?.slots) {
        setSeeded(true);
        const slots = timeSlotsQuery.data.slots;
        const restricted = slots.filter((s) => s.restrictedProgramIds.length > 0);
        if (restricted.length > 0) {
            // 전체/일부 무관 선택했던 시간대·클래스 그대로 복원, 바텀시트 생략 → timeslots 진입.
            setScope('TIME_SLOTS');
            setSelectedSlotIds(restricted.map((s) => s.slotId));
            setTimeRanges(
                restricted.map((s) => ({
                    startAt: toKSTOffsetISO(s.startAt),
                    endAt: toKSTOffsetISO(s.endAt),
                })),
            );
            setInitialProgramIds(
                Array.from(new Set(restricted.flatMap((s) => s.restrictedProgramIds))),
            );
            setPrefilled(true);
            setStep('timeslots');
        }
    }

    // scope 바텀시트: 신규(미prefill)일 때만, 시드 완료 후 노출(데이터 도착 전 플래시 방지).
    useEffect(() => {
        if (!storeId) return;
        if (step === 'scope' && seeded) {
            openSheet(
                <RestrictionScopeBottomSheet
                    date={date}
                    initialScope={scope}
                    onNext={(selectedScope) => {
                        setScope(selectedScope);
                        closeSheet();
                        if (selectedScope === 'ALL_DAY') {
                            setStep('programs');
                        } else {
                            setStep('timeslots');
                        }
                    }}
                />,
            );
        }
    }, [step, storeId, scope, seeded]);

    if (!storeId) return null;

    // prefill(기존 제한 존재) 재진입 시에만 노출: 해당 날짜 제한 전체 해제.
    const handleUnrestrict = () => {
        if (deleteMutation.isPending) return;
        // 먼저 캘린더로 보내고 토스트를 띄운다. 페이지를 떠나면(언마운트) mutate per-call
        // onSuccess는 실행되지 않으므로, 전역 토스트를 즉시 호출하고 실패만 별도로 알린다.
        router.push(`/partner/reservations?date=${date}`);
        pushToast({
            type: 'icon',
            icon: <InformationIcon />,
            message: `'${formatKoreanMonthDayWithWeekday(date)}'의 예약 제한이 해제되었어요`,
        });
        deleteMutation.mutate(
            { date },
            {
                onError: () => {
                    pushToast({ message: '예약 제한 해제 중 오류가 발생했습니다.' });
                },
            },
        );
    };

    if (step === 'timeslots') {
        return (
            <RestrictionTimeSlotsClient
                storeId={storeId}
                date={date}
                initialSelectedSlotIds={selectedSlotIds}
                onUnrestrict={prefilled ? handleUnrestrict : undefined}
                unrestrictPending={deleteMutation.isPending}
                onBack={() => {
                    // prefill 재진입은 바텀시트를 건너뛰었으므로 뒤로가기 → 캘린더 복귀.
                    if (prefilled) {
                        router.push(`/partner/reservations?date=${date}`);
                    } else {
                        setStep('scope');
                    }
                }}
                onNext={(slotIds, ranges) => {
                    setSelectedSlotIds(slotIds);
                    setTimeRanges(ranges);
                    setStep('programs');
                }}
            />
        );
    }

    if (step === 'programs') {
        return (
            <RestrictionProgramsClient
                storeId={storeId}
                date={date}
                scope={scope}
                selectedSlotIds={selectedSlotIds}
                timeRanges={timeRanges}
                initialSelectedProgramIds={initialProgramIds}
                onBack={() => {
                    if (scope === 'ALL_DAY') {
                        // 종일 경로: 클래스 선택 뒤로가기 → 바텀시트 재노출 없이 캘린더 복귀.
                        router.push(`/partner/reservations?date=${date}`);
                    } else {
                        setStep('timeslots');
                    }
                }}
            />
        );
    }

    // step=scope: 캘린더 뷰를 베이스로 깔고 그 위에 범위 선택 바텀시트가 뜬다.
    return <ReservationCalendarView storeId={storeId} />;
}
