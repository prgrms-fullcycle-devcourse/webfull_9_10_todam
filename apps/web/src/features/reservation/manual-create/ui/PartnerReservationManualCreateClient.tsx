'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    BottomBar,
    Button,
    Counter,
    InformationIcon,
    LeftIcon,
    RadioInput,
    RightIcon,
    StandardBottomSheet,
    TextArea,
    TextInput,
} from '@todam/ui';
import {
    formatKoreanMonthDayWithWeekday,
    formatDateKey,
    formatPhone,
    formatScheduled,
    getTodayDateKey,
    PHONE_REGEX,
    ProgramStatus,
    ReservationDeliveryMethod,
    type PartnerManualInitialStatus,
    type PartnerProgramListItem,
    type TimeSlotItem,
} from '@todam/shared';

import {
    useCreatePartnerReservationMutation,
    usePartnerProgramReservationCounts,
    usePartnerTimeSlotsByDate,
} from '@/entities/reservation';
import { usePartnerStudioPrograms, usePartnerStudioDetail } from '@/entities/studio';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useSheet, useToast } from '@/shared/model';

type Step = 'time' | 'program' | 'form';

type Props = {
    storeId: string;
    initialDate?: string;
};

type StatusOption = {
    value: PartnerManualInitialStatus;
    title: string;
    description: string;
};

const STATUS_OPTIONS: StatusOption[] = [
    {
        value: 'CONFIRMED',
        title: '예약 확정',
        description: '전화 또는 현장에서 접수된 예약이에요.',
    },
    {
        value: 'IN_PROGRESS',
        title: '체험 완료',
        description: '이미 체험이 완료된 예약이에요.',
    },
];

function shiftDateKey(dateKey: string, amount: number): string {
    const [year, month, date] = dateKey.split('-').map(Number);
    const next = new Date(year ?? 0, (month ?? 1) - 1, date ?? 1);
    next.setDate(next.getDate() + amount);
    return formatDateKey(next);
}

function timeRange(slot: Pick<TimeSlotItem, 'startAt' | 'endAt'>): string {
    return `${formatScheduled(slot.startAt).time} ~ ${formatScheduled(slot.endAt).time}`;
}

function normalizeMemo(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function statusToToastDate(dateKey: string): string {
    return formatKoreanMonthDayWithWeekday(dateKey).replace(' ', ' ');
}

function RegistrationStatusSheet({
    isPending,
    onSubmit,
}: {
    isPending: boolean;
    onSubmit: (status: PartnerManualInitialStatus) => void;
}) {
    const [selected, setSelected] = useState<PartnerManualInitialStatus>('CONFIRMED');

    return (
        <StandardBottomSheet
            title="예약을 어떻게 등록할까요?"
            subTitle="현재 진행 상태에 맞는 예약 상태를 선택해 주세요."
            actionLabel={isPending ? '등록 중' : '등록하기'}
            onAction={() => onSubmit(selected)}
        >
            <div role="radiogroup" className="flex flex-col gap-3">
                {STATUS_OPTIONS.map((option) => (
                    <RadioInput
                        key={option.value}
                        title={option.title}
                        description={option.description}
                        selected={selected === option.value}
                        onSelect={() => setSelected(option.value)}
                        className="items-start p-4"
                    />
                ))}
            </div>
        </StandardBottomSheet>
    );
}

export function PartnerReservationManualCreateClient({ storeId, initialDate }: Props) {
    const router = useRouter();
    const { open: openSheet, close: closeSheet } = useSheet();
    const { push: pushToast } = useToast();

    const [step, setStep] = useState<Step>('time');
    const [selectedDate, setSelectedDate] = useState(initialDate || getTodayDateKey());
    const [selectedSlotKey, setSelectedSlotKey] = useState('');
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [reserverName, setReserverName] = useState('');
    const [reserverPhone, setReserverPhone] = useState('');
    const [participantCount, setParticipantCount] = useState(1);
    const [deliveryMethod, setDeliveryMethod] = useState<ReservationDeliveryMethod>(
        ReservationDeliveryMethod.DELIVERY,
    );
    const [internalMemo, setInternalMemo] = useState('');

    const timeSlotsQuery = usePartnerTimeSlotsByDate(storeId, selectedDate);
    const programsQuery = usePartnerStudioPrograms(storeId);
    const storeName = usePartnerStudioDetail(storeId).data?.store.name;
    const mutation = useCreatePartnerReservationMutation(storeId);

    const slots = useMemo(
        () =>
            (timeSlotsQuery.data?.slots ?? []).filter(
                (slot) => slot.status === 'OPEN' && slot.remainingCount > 0,
            ),
        [timeSlotsQuery.data?.slots],
    );

    const selectedSlot = slots.find((slot) => slot.slotKey === selectedSlotKey);
    const selectedSlotKeys = selectedSlot ? [selectedSlot.slotKey] : [];
    const countsQuery = usePartnerProgramReservationCounts(
        storeId,
        selectedDate,
        selectedSlotKeys,
        step !== 'time',
    );

    const activePrograms = useMemo(
        () =>
            (programsQuery.data?.programs ?? []).filter(
                (program) => program.status === ProgramStatus.ACTIVE,
            ),
        [programsQuery.data?.programs],
    );

    const selectablePrograms = useMemo(() => {
        if (!selectedSlot) return [];
        const restricted = new Set(selectedSlot.restrictedProgramIds);
        return activePrograms.filter((program) => !restricted.has(program.id));
    }, [activePrograms, selectedSlot]);

    const selectedProgram = selectablePrograms.find((program) => program.id === selectedProgramId);
    const programCountById = new Map(
        (countsQuery.data?.programs ?? []).map((item) => [
            item.programId,
            item.confirmedReservationCount,
        ]),
    );

    const nameValid = reserverName.trim().length > 0;
    const phoneValid = PHONE_REGEX.test(reserverPhone);
    const formReady =
        Boolean(selectedSlot) &&
        Boolean(selectedProgram) &&
        nameValid &&
        phoneValid &&
        participantCount > 0 &&
        participantCount <= (selectedSlot?.remainingCount ?? 0) &&
        internalMemo.length <= 200;

    const backToCalendar = () => router.push(`/partner/reservations?date=${selectedDate}`);

    useHeaderOverride({
        title: storeName ? `${storeName} 예약 등록하기` : '예약 등록하기',
        hideRightAction: true,
        onBack: () => {
            if (step === 'time') {
                backToCalendar();
                return;
            }
            if (step === 'program') {
                setStep('time');
                return;
            }
            setStep('program');
        },
    });

    const resetDownstream = () => {
        setSelectedSlotKey('');
        setSelectedProgramId('');
        setStep('time');
    };

    const handleDateShift = (amount: number) => {
        setSelectedDate((current) => shiftDateKey(current, amount));
        resetDownstream();
    };

    const handleSlotSelect = (slot: TimeSlotItem) => {
        setSelectedSlotKey(slot.slotKey);
        setSelectedProgramId('');
        setParticipantCount((current) => Math.min(current, Math.max(1, slot.remainingCount)));
    };

    const handleProgramSelect = (programId: string) => {
        setSelectedProgramId(programId);
        const program = selectablePrograms.find((item) => item.id === programId);
        // deliverable=false 클래스는 택배 불가 → PICKUP 강제.
        setDeliveryMethod(
            program?.deliverable
                ? ReservationDeliveryMethod.DELIVERY
                : ReservationDeliveryMethod.PICKUP,
        );
    };

    const handleSubmit = (initialStatus: PartnerManualInitialStatus) => {
        if (!selectedSlot || !selectedProgram || !formReady) return;

        mutation.mutate(
            {
                programId: selectedProgram.id,
                slotKey: selectedSlot.slotKey,
                reserverName: reserverName.trim(),
                reserverPhone,
                participantCount,
                deliveryMethod: selectedProgram.deliverable
                    ? deliveryMethod
                    : ReservationDeliveryMethod.PICKUP,
                initialStatus,
                internalMemo: normalizeMemo(internalMemo),
            },
            {
                onSuccess: () => {
                    closeSheet();
                    pushToast({
                        type: 'icon',
                        icon: <InformationIcon />,
                        message: `'${statusToToastDate(selectedDate)}'에 예약 등록이 완료되었어요`,
                    });
                    router.push(`/partner/reservations?date=${selectedDate}`);
                },
                onError: () => {
                    pushToast({ message: '예약 등록 중 오류가 발생했습니다.' });
                },
            },
        );
    };

    const openStatusSheet = () => {
        if (!formReady || mutation.isPending) return;
        openSheet(
            <RegistrationStatusSheet isPending={mutation.isPending} onSubmit={handleSubmit} />,
        );
    };

    return (
        <>
            <div className="px-4 pb-28">
                <section className="flex flex-col gap-3 py-2">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="flex items-center gap-4">
                            {step === 'time' && (
                                <Button
                                    variant="ghost"
                                    layout="onlyIcon"
                                    size="sm"
                                    icon={<LeftIcon />}
                                    aria-label="이전 날짜"
                                    onClick={() => handleDateShift(-1)}
                                    className="hover:!bg-transparent"
                                />
                            )}
                            <h1 className="text-2xl font-bold text-foreground">
                                {formatKoreanMonthDayWithWeekday(selectedDate)}
                            </h1>
                            {step === 'time' && (
                                <Button
                                    variant="ghost"
                                    layout="onlyIcon"
                                    size="sm"
                                    icon={<RightIcon />}
                                    aria-label="다음 날짜"
                                    onClick={() => handleDateShift(1)}
                                    className="hover:!bg-transparent"
                                />
                            )}
                        </div>
                        {selectedSlot && (
                            <p className="text-base text-foreground">{timeRange(selectedSlot)}</p>
                        )}
                        {selectedProgram && (
                            <p className="text-base text-foreground">{selectedProgram.title}</p>
                        )}
                        <p className="text-sm text-foreground-tertiary">
                            {step === 'time' && '예약을 등록할 시간대를 선택해 주세요'}
                            {step === 'program' && '예약을 등록할 클래스를 선택해 주세요'}
                            {step === 'form' && '예약자 정보를 입력해 주세요'}
                        </p>
                    </div>
                </section>

                <section className="flex flex-col gap-3 py-2">
                    {step === 'time' && (
                        <TimeStep
                            isLoading={timeSlotsQuery.isLoading}
                            slots={slots}
                            selectedSlotKey={selectedSlotKey}
                            onSelect={handleSlotSelect}
                        />
                    )}

                    {step === 'program' && (
                        <ProgramStep
                            isLoading={programsQuery.isLoading || countsQuery.isLoading}
                            programs={selectablePrograms}
                            selectedProgramId={selectedProgramId}
                            countById={programCountById}
                            onSelect={handleProgramSelect}
                        />
                    )}

                    {step === 'form' && (
                        <FormStep
                            reserverName={reserverName}
                            reserverPhone={reserverPhone}
                            participantCount={participantCount}
                            maxParticipantCount={selectedSlot?.remainingCount ?? 1}
                            deliverable={selectedProgram?.deliverable ?? false}
                            deliveryMethod={deliveryMethod}
                            internalMemo={internalMemo}
                            phoneValid={phoneValid}
                            onChangeName={setReserverName}
                            onChangePhone={(value) => setReserverPhone(formatPhone(value))}
                            onChangeParticipantCount={setParticipantCount}
                            onChangeDeliveryMethod={setDeliveryMethod}
                            onChangeMemo={setInternalMemo}
                        />
                    )}
                </section>
            </div>

            <BottomBar>
                {step === 'time' && (
                    <Button
                        size="lg"
                        className="w-full"
                        disabled={!selectedSlotKey}
                        onClick={() => setStep('program')}
                    >
                        시간대 선택 완료
                    </Button>
                )}
                {step === 'program' && (
                    <Button
                        size="lg"
                        className="w-full"
                        disabled={!selectedProgramId}
                        onClick={() => setStep('form')}
                    >
                        클래스 선택 완료
                    </Button>
                )}
                {step === 'form' && (
                    <Button
                        size="lg"
                        className="w-full"
                        disabled={!formReady}
                        onClick={openStatusSheet}
                    >
                        입력 완료
                    </Button>
                )}
            </BottomBar>
        </>
    );
}

function TimeStep({
    isLoading,
    slots,
    selectedSlotKey,
    onSelect,
}: {
    isLoading: boolean;
    slots: TimeSlotItem[];
    selectedSlotKey: string;
    onSelect: (slot: TimeSlotItem) => void;
}) {
    if (isLoading) {
        return (
            <p className="py-10 text-center text-sm text-foreground-tertiary">
                시간대를 불러오는 중입니다.
            </p>
        );
    }

    if (slots.length === 0) {
        return (
            <p className="py-10 text-center text-sm text-foreground-tertiary">
                등록 가능한 시간대가 없습니다.
            </p>
        );
    }

    return (
        <div role="radiogroup" className="flex flex-1 flex-col gap-3">
            {slots.map((slot) => (
                <RadioInput
                    key={slot.slotKey}
                    title={timeRange(slot)}
                    description={
                        slot.confirmedReservationCount > 0
                            ? `확정 인원 ${slot.confirmedReservationCount}명`
                            : undefined
                    }
                    selected={selectedSlotKey === slot.slotKey}
                    onSelect={() => onSelect(slot)}
                />
            ))}
        </div>
    );
}

function ProgramStep({
    isLoading,
    programs,
    selectedProgramId,
    countById,
    onSelect,
}: {
    isLoading: boolean;
    programs: PartnerProgramListItem[];
    selectedProgramId: string;
    countById: Map<string, number>;
    onSelect: (programId: string) => void;
}) {
    if (isLoading) {
        return (
            <p className="py-10 text-center text-sm text-foreground-tertiary">
                클래스를 불러오는 중입니다.
            </p>
        );
    }

    if (programs.length === 0) {
        return (
            <p className="py-10 text-center text-sm text-foreground-tertiary">
                선택 가능한 클래스가 없습니다.
            </p>
        );
    }

    return (
        <div role="radiogroup" className="flex flex-1 flex-col gap-3">
            {programs.map((program) => (
                <RadioInput
                    key={program.id}
                    title={program.title}
                    description={`확정 인원 ${countById.get(program.id) ?? 0}명`}
                    selected={selectedProgramId === program.id}
                    onSelect={() => onSelect(program.id)}
                />
            ))}
        </div>
    );
}

function FormStep({
    reserverName,
    reserverPhone,
    participantCount,
    maxParticipantCount,
    deliverable,
    deliveryMethod,
    internalMemo,
    phoneValid,
    onChangeName,
    onChangePhone,
    onChangeParticipantCount,
    onChangeDeliveryMethod,
    onChangeMemo,
}: {
    reserverName: string;
    reserverPhone: string;
    participantCount: number;
    maxParticipantCount: number;
    deliverable: boolean;
    deliveryMethod: ReservationDeliveryMethod;
    internalMemo: string;
    phoneValid: boolean;
    onChangeName: (value: string) => void;
    onChangePhone: (value: string) => void;
    onChangeParticipantCount: (value: number) => void;
    onChangeDeliveryMethod: (value: ReservationDeliveryMethod) => void;
    onChangeMemo: (value: string) => void;
}) {
    return (
        <div className="flex flex-1 flex-col gap-5">
            <TextInput
                id="manual-reserver-name"
                label="이름"
                value={reserverName}
                placeholder="예약자 성함"
                onChange={(e) => onChangeName(e.target.value)}
            />
            <TextInput
                id="manual-reserver-phone"
                label="연락처"
                value={reserverPhone}
                placeholder="010-0000-0000"
                inputMode="numeric"
                error={Boolean(reserverPhone) && !phoneValid}
                helperText={
                    reserverPhone && !phoneValid
                        ? '휴대폰 번호 11자리를 정확히 입력해 주세요.'
                        : undefined
                }
                onChange={(e) => onChangePhone(e.target.value)}
            />
            <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground-tertiary">인원 수</p>
                <Counter
                    value={participantCount}
                    min={1}
                    max={Math.max(1, maxParticipantCount)}
                    onChange={onChangeParticipantCount}
                    className="justify-between px-2"
                />
            </div>
            {deliverable && (
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-foreground-tertiary">작품 수령 방식</p>
                    <div role="radiogroup" className="grid grid-cols-2 gap-3">
                        <RadioInput
                            title="택배"
                            selected={deliveryMethod === ReservationDeliveryMethod.DELIVERY}
                            onSelect={() =>
                                onChangeDeliveryMethod(ReservationDeliveryMethod.DELIVERY)
                            }
                        />
                        <RadioInput
                            title="직접 수령"
                            selected={deliveryMethod === ReservationDeliveryMethod.PICKUP}
                            onSelect={() =>
                                onChangeDeliveryMethod(ReservationDeliveryMethod.PICKUP)
                            }
                        />
                    </div>
                </div>
            )}
            <TextArea
                id="manual-internal-memo"
                label="내부 메모"
                optional
                value={internalMemo}
                maxLength={200}
                showCount
                placeholder="전화 예약 / 현장 결제 예정 / 1명 추가 가능성 있음"
                className="min-h-[132px]"
                onChange={(e) => onChangeMemo(e.target.value)}
            />
        </div>
    );
}
