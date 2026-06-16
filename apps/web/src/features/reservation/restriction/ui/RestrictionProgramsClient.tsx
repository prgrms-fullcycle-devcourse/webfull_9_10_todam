'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    BottomBar,
    Button,
    CheckboxInput,
    DescriptionBlock,
    InformationIcon,
    SparkleIcon,
} from '@todam/ui';
import { formatKoreanMonthDayWithWeekday, ProgramStatus } from '@todam/shared';
import type { ReservationRestrictionTimeRange } from '@todam/shared';

import {
    useCreatePartnerReservationRestrictionsMutation,
    usePartnerProgramReservationCounts,
} from '@/entities/reservation';
import { usePartnerStudioPrograms } from '@/entities/studio';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useToast } from '@/shared/model';

type Props = {
    storeId: string;
    date: string;
    scope: 'ALL_DAY' | 'TIME_SLOTS';
    selectedSlotKeys: string[];
    timeRanges: ReservationRestrictionTimeRange[];
    initialSelectedProgramIds?: string[];
    onBack: () => void;
};

function formatTimeRange(range: ReservationRestrictionTimeRange): string {
    // offset ISO → 시:분 표시 (formatScheduled는 UTC 기준이므로 직접 파싱)
    const parseHHmm = (iso: string): string => {
        // '+09:00' 형태이므로 직접 슬라이싱
        const timePart = iso.slice(11, 16); // 'HH:mm'
        return timePart;
    };
    return `${parseHHmm(range.startAt)} ~ ${parseHHmm(range.endAt)}`;
}

export function RestrictionProgramsClient({
    storeId,
    date,
    scope,
    selectedSlotKeys,
    timeRanges,
    initialSelectedProgramIds = [],
    onBack,
}: Props) {
    const router = useRouter();
    const { push: pushToast } = useToast();
    const [selectedProgramIds, setSelectedProgramIds] = useState<Set<string>>(
        () => new Set(initialSelectedProgramIds),
    );
    const [timeRangesExpanded, setTimeRangesExpanded] = useState(false);

    // 전체 활성 클래스 = 선택 대상. reservation-counts는 확정 예약 있는 클래스만 주므로
    // 목록 소스로 쓸 수 없고, 확정 건수 캡션 용도로만 Map 병합한다.
    const programsQuery = usePartnerStudioPrograms(storeId);
    const countsQuery = usePartnerProgramReservationCounts(
        storeId,
        date,
        selectedSlotKeys,
        true,
        scope === 'ALL_DAY',
    );

    const programs = useMemo(
        () =>
            (programsQuery.data?.programs ?? []).filter(
                (program) => program.status === ProgramStatus.ACTIVE,
            ),
        [programsQuery.data?.programs],
    );
    const countById = useMemo(
        () =>
            new Map(
                (countsQuery.data?.programs ?? []).map((item) => [
                    item.programId,
                    item.confirmedReservationCount,
                ]),
            ),
        [countsQuery.data?.programs],
    );
    const allSelected = programs.length > 0 && selectedProgramIds.size === programs.length;
    const totalConfirmedCount = programs.reduce((sum, p) => sum + (countById.get(p.id) ?? 0), 0);

    const mutation = useCreatePartnerReservationRestrictionsMutation(storeId);

    useHeaderOverride({
        title: '예약 제한 클래스 선택',
        hideRightAction: true,
        onBack,
    });

    const toggleAll = () => {
        if (allSelected) {
            setSelectedProgramIds(new Set());
        } else {
            setSelectedProgramIds(new Set(programs.map((p) => p.id)));
        }
    };

    const toggleProgram = (programId: string) => {
        setSelectedProgramIds((prev) => {
            const next = new Set(prev);
            if (next.has(programId)) {
                next.delete(programId);
            } else {
                next.add(programId);
            }
            return next;
        });
    };

    const handleSubmit = () => {
        if (selectedProgramIds.size === 0 || mutation.isPending) return;

        const body =
            scope === 'TIME_SLOTS'
                ? {
                      date,
                      scope: 'TIME_SLOTS' as const,
                      timeRanges,
                      programIds: Array.from(selectedProgramIds),
                  }
                : {
                      date,
                      scope: 'ALL_DAY' as const,
                      programIds: Array.from(selectedProgramIds),
                  };

        mutation.mutate(body, {
            onSuccess: () => {
                const dateLabel = formatKoreanMonthDayWithWeekday(date);
                pushToast({
                    type: 'icon',
                    icon: <InformationIcon />,
                    message: `'${dateLabel}'에 예약 제한이 적용되었어요`,
                });
                router.push(`/partner/reservations?date=${date}`);
            },
            onError: () => {
                pushToast({ message: '예약 제한 적용 중 오류가 발생했습니다.' });
            },
        });
    };

    return (
        <>
            <div className="px-4 pb-28">
                <section className="flex flex-col gap-3 py-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-foreground">
                            {formatKoreanMonthDayWithWeekday(date)}
                        </h1>
                        <p className="text-sm text-foreground-tertiary">
                            신규 예약을 제한할 클래스를 선택해 주세요.
                        </p>
                    </div>

                    <DescriptionBlock type="warn" title="예약 제한 안내" icon={<SparkleIcon />}>
                        이미 확정된 예약은 취소되지 않고 유지돼요. 예약 제한 설정 완료 시점부터 신규
                        예약을 할 수 없어요.
                    </DescriptionBlock>
                </section>

                {scope === 'TIME_SLOTS' && timeRanges.length > 0 && (
                    <section className="py-2">
                        <button
                            type="button"
                            className="flex w-full items-center justify-between py-2 text-sm font-semibold text-foreground"
                            onClick={() => setTimeRangesExpanded((v) => !v)}
                        >
                            <span>선택한 시간대 {timeRanges.length}구간</span>
                            <span className="text-foreground-tertiary">
                                {timeRangesExpanded ? '접기' : '펼치기'}
                            </span>
                        </button>
                        {timeRangesExpanded && (
                            <ul className="flex flex-col gap-1 pb-2">
                                {timeRanges.map((range, i) => (
                                    <li key={i} className="text-sm text-foreground-secondary">
                                        {formatTimeRange(range)}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                <section className="flex flex-col gap-2 py-2">
                    {programsQuery.isLoading ? (
                        <p className="py-10 text-center text-sm text-foreground-tertiary">
                            클래스를 불러오는 중입니다.
                        </p>
                    ) : programs.length === 0 ? (
                        <p className="py-10 text-center text-sm text-foreground-tertiary">
                            선택 가능한 클래스가 없습니다.
                        </p>
                    ) : (
                        <>
                            <CheckboxInput
                                label="모든 클래스 선택"
                                className="font-semibold"
                                bordered
                                checked={allSelected}
                                onCheckedChange={toggleAll}
                                action={
                                    totalConfirmedCount > 0 ? (
                                        <span className="font-semibold text-primary">
                                            확정 예약 총 {totalConfirmedCount}건
                                        </span>
                                    ) : undefined
                                }
                            />
                            {programs.map((program) => {
                                const count = countById.get(program.id) ?? 0;
                                return (
                                    <CheckboxInput
                                        key={program.id}
                                        label={program.title}
                                        checked={selectedProgramIds.has(program.id)}
                                        onCheckedChange={() => toggleProgram(program.id)}
                                        bordered
                                        action={
                                            count > 0 ? (
                                                <span className="shrink-0 text-primary">
                                                    확정 예약 {count}건
                                                </span>
                                            ) : undefined
                                        }
                                    />
                                );
                            })}
                        </>
                    )}
                </section>
            </div>

            <BottomBar>
                <Button
                    size="lg"
                    className="w-full"
                    disabled={selectedProgramIds.size === 0 || mutation.isPending}
                    onClick={handleSubmit}
                >
                    {mutation.isPending ? '적용 중' : '예약 제한 적용하기'}
                </Button>
            </BottomBar>
        </>
    );
}
