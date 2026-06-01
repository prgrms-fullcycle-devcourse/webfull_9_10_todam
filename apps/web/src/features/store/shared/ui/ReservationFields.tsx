'use client';

import { Counter, RadioInput } from '@todam/ui';

import { INTERVAL_OPTIONS } from '../model';

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
                <div className="grid grid-cols-4 gap-2">
                    {INTERVAL_OPTIONS.map(({ label, value }) => {
                        const selected = intervalMinutes === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => onChangeInterval(value)}
                                className={[
                                    'flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl text-base transition-colors',
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
                    <Counter value={cancelDeadlineDays} min={0} onChange={onChangeCancelDeadline} />
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
                    <Counter value={maxCapacity} min={1} onChange={onChangeMaxCapacity} />
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
