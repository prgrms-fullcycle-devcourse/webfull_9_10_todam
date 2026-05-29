'use client';

import { Checkbox } from '@todam/ui';

import { useStoreRegistrationStore } from '../model/store';
import { CONVENIENCE_OPTIONS, DAY_CHIPS } from '../model/types';

function TimeField({
    label,
    value,
    onChange,
    invalid,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    invalid?: boolean;
}) {
    return (
        <label className="flex flex-1 flex-col gap-2">
            <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">{label}</span>
            <input
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={[
                    'h-12 w-full rounded-xl border bg-surface px-4 text-base text-foreground outline-none',
                    invalid ? 'border-danger' : 'border-border-subtle',
                ].join(' ')}
            />
        </label>
    );
}

export function OperatingStep() {
    const operating = useStoreRegistrationStore((s) => s.form.operating);
    const convenienceInfo = useStoreRegistrationStore((s) => s.form.store.convenienceInfo);
    const patchOperating = useStoreRegistrationStore((s) => s.patchOperating);
    const toggleBusinessDay = useStoreRegistrationStore((s) => s.toggleBusinessDay);
    const toggleConvenience = useStoreRegistrationStore((s) => s.toggleConvenience);

    const hoursInvalid =
        !!operating.openTime && !!operating.closeTime && operating.openTime >= operating.closeTime;
    const breakInvalid =
        !!operating.breakStart &&
        !!operating.breakEnd &&
        operating.breakStart >= operating.breakEnd;

    return (
        <div className="flex flex-col gap-6">
            {/* 예약 오픈 / 마감 */}
            <div className="flex flex-col gap-2">
                <div className="flex gap-3">
                    <TimeField
                        label="예약 오픈"
                        value={operating.openTime}
                        invalid={hoursInvalid}
                        onChange={(v) => patchOperating({ openTime: v })}
                    />
                    <TimeField
                        label="예약 마감"
                        value={operating.closeTime}
                        invalid={hoursInvalid}
                        onChange={(v) => patchOperating({ closeTime: v })}
                    />
                </div>
                {hoursInvalid && (
                    <p className="px-[5px] text-xs text-danger">마감은 오픈보다 늦어야 합니다.</p>
                )}
            </div>

            {/* 휴식 시작 / 종료 (선택) */}
            <div className="flex flex-col gap-2">
                <div className="flex gap-3">
                    <TimeField
                        label="휴식 시작 (선택)"
                        value={operating.breakStart}
                        invalid={breakInvalid}
                        onChange={(v) => patchOperating({ breakStart: v })}
                    />
                    <TimeField
                        label="휴식 종료 (선택)"
                        value={operating.breakEnd}
                        invalid={breakInvalid}
                        onChange={(v) => patchOperating({ breakEnd: v })}
                    />
                </div>
                {breakInvalid && (
                    <p className="px-[5px] text-xs text-danger">
                        휴식 종료는 시작보다 늦어야 합니다.
                    </p>
                )}
            </div>

            {/* 영업일 */}
            <div className="flex flex-col gap-2">
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    영업일
                </span>
                <div className="flex flex-wrap gap-2">
                    {DAY_CHIPS.map(({ label, value }) => {
                        const selected = operating.businessDays.includes(value);
                        return (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => toggleBusinessDay(value)}
                                className={[
                                    'flex h-12 w-12 items-center justify-center rounded-2xl text-base font-semibold transition-colors',
                                    selected
                                        ? 'bg-inverse text-foreground-inverse'
                                        : 'border border-border-subtle bg-surface text-foreground',
                                ].join(' ')}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 편의 정보 */}
            <div className="flex flex-col gap-2">
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    편의 정보
                </span>
                <div className="flex flex-col gap-2">
                    {CONVENIENCE_OPTIONS.map(({ key, label }) => (
                        <div
                            key={key}
                            onClick={() => toggleConvenience(key)}
                            className="flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3"
                        >
                            <Checkbox checked={convenienceInfo[key]} />
                            <span className="text-base text-foreground-secondary">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
