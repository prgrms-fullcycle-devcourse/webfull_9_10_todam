'use client';

import { Button, MinusCircleIcon, PlusCircleIcon, RadioInput } from '@todam/ui';

import { INTERVAL_OPTIONS } from '../model';

function Stepper({
    value,
    onDecrement,
    onIncrement,
    min = 0,
}: {
    value: number;
    onDecrement: () => void;
    onIncrement: () => void;
    min?: number;
}) {
    return (
        <div className="flex h-12 items-center gap-3 rounded-2xl border border-border-subtle bg-surface px-1">
            <Button
                variant="ghost"
                layout="onlyIcon"
                size="sm"
                icon={<MinusCircleIcon />}
                aria-label="감소"
                disabled={value <= min}
                onClick={onDecrement}
                className="hover:!bg-transparent"
            />
            <span className="min-w-3 text-center text-base text-foreground-secondary">{value}</span>
            <Button
                variant="ghost"
                layout="onlyIcon"
                size="sm"
                icon={<PlusCircleIcon />}
                aria-label="증가"
                onClick={onIncrement}
                className="hover:!bg-transparent"
            />
        </div>
    );
}

interface ReservationFieldsProps {
    intervalMinutes: number;
    cancelDeadlineDays: number;
    maxCapacity: number;
    autoConfirm: boolean | null;
    onChangeInterval: (value: number) => void;
    onChangeCancelDeadline: (value: number) => void;
    onChangeMaxCapacity: (value: number) => void;
    onChangeAutoConfirm: (value: boolean) => void;
}

// 예약 정보 입력 (등록·수정 공유, store 비종속). 값+핸들러 props.
export function ReservationFields({
    intervalMinutes,
    cancelDeadlineDays,
    maxCapacity,
    autoConfirm,
    onChangeInterval,
    onChangeCancelDeadline,
    onChangeMaxCapacity,
    onChangeAutoConfirm,
}: ReservationFieldsProps) {
    return (
        <div className="flex flex-col gap-6">
            {/* 예약 시간 간격 */}
            <section className="flex flex-col gap-2">
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    예약 시간 간격
                </span>
                <div className="flex flex-wrap gap-2">
                    {INTERVAL_OPTIONS.map(({ label, value }) => {
                        const selected = intervalMinutes === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => onChangeInterval(value)}
                                className={[
                                    'flex h-12 items-center justify-center rounded-2xl px-4 text-base transition-colors',
                                    selected
                                        ? 'bg-inverse font-semibold text-foreground-inverse'
                                        : 'border border-border-subtle bg-surface text-foreground-secondary',
                                ].join(' ')}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* 예약 취소 가능 기한 */}
            <section className="flex flex-col gap-2">
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    예약 취소 가능 기한
                </span>
                <div className="flex items-center gap-2 text-base text-foreground-secondary">
                    <span>체험일</span>
                    <Stepper
                        value={cancelDeadlineDays}
                        min={0}
                        onDecrement={() =>
                            onChangeCancelDeadline(Math.max(0, cancelDeadlineDays - 1))
                        }
                        onIncrement={() => onChangeCancelDeadline(cancelDeadlineDays + 1)}
                    />
                    <span>일 전까지 취소 가능</span>
                </div>
            </section>

            {/* 시간대별 최대 정원 */}
            <section className="flex flex-col gap-2">
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    시간대별 최대 정원
                </span>
                <div className="flex items-center gap-2 text-base text-foreground-secondary">
                    <span>최대</span>
                    <Stepper
                        value={maxCapacity}
                        min={1}
                        onDecrement={() => onChangeMaxCapacity(Math.max(1, maxCapacity - 1))}
                        onIncrement={() => onChangeMaxCapacity(maxCapacity + 1)}
                    />
                    <span>명까지 예약 가능</span>
                </div>
            </section>

            {/* 예약 승인 방식 */}
            <section className="flex flex-col gap-3">
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    예약 승인 방식
                </span>
                <RadioInput
                    title="승인 후 확정"
                    description="예약 내역을 확인하고 직접 확정해야 예약이 완료돼요."
                    selected={autoConfirm === false}
                    onSelect={() => onChangeAutoConfirm(false)}
                />
                <RadioInput
                    title="자동 확정"
                    description="수강생이 예약을 마치면 별도 승인 없이 즉시 확정돼요."
                    selected={autoConfirm === true}
                    onSelect={() => onChangeAutoConfirm(true)}
                />
            </section>
        </div>
    );
}
