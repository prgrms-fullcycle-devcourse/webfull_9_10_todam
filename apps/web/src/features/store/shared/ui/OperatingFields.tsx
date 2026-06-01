'use client';

import { CheckboxInput } from '@todam/ui';

import {
    CONVENIENCE_OPTIONS,
    DAY_CHIPS,
    type ConvenienceState,
    type OperatingState,
} from '../model';
import { TimeField } from './TimeField';

interface OperatingFieldsProps {
    operating: OperatingState;
    convenienceInfo: ConvenienceState;
    onPatchOperating: (patch: Partial<OperatingState>) => void;
    onToggleBusinessDay: (day: number) => void;
    onToggleConvenience: (key: keyof ConvenienceState) => void;
}

// 영업 정보 입력 (등록·수정 공유, store 비종속).
// 검증/인라인 에러는 operating 값으로 내부 계산 — 수정 화면의 더 엄격한 기준 채택
// (휴식 범위·영업일 최소 1개). 등록 next 버튼 gating(isStepValid)은 store 쪽 로직 유지.
export function OperatingFields({
    operating,
    convenienceInfo,
    onPatchOperating,
    onToggleBusinessDay,
    onToggleConvenience,
}: OperatingFieldsProps) {
    const hoursInvalid =
        !!operating.openTime && !!operating.closeTime && operating.openTime >= operating.closeTime;
    const hasBreak = !!operating.breakStart && !!operating.breakEnd;
    const breakOrderInvalid = hasBreak && operating.breakStart >= operating.breakEnd;
    const breakRangeInvalid =
        hasBreak &&
        !breakOrderInvalid &&
        (operating.breakStart < operating.openTime || operating.breakEnd > operating.closeTime);
    const noBusinessDay = operating.businessDays.length === 0;

    return (
        <div className="flex flex-col gap-6">
            {/* 예약 오픈 / 마감 */}
            <div className="flex flex-col gap-2">
                <div className="flex gap-3">
                    <TimeField
                        label="예약 오픈"
                        value={operating.openTime}
                        invalid={hoursInvalid}
                        onChange={(v) => onPatchOperating({ openTime: v })}
                    />
                    <TimeField
                        label="예약 마감"
                        value={operating.closeTime}
                        invalid={hoursInvalid}
                        onChange={(v) => onPatchOperating({ closeTime: v })}
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
                        invalid={breakOrderInvalid || breakRangeInvalid}
                        onChange={(v) => onPatchOperating({ breakStart: v })}
                    />
                    <TimeField
                        label="휴식 종료 (선택)"
                        value={operating.breakEnd}
                        invalid={breakOrderInvalid || breakRangeInvalid}
                        onChange={(v) => onPatchOperating({ breakEnd: v })}
                    />
                </div>
                {breakOrderInvalid && (
                    <p className="px-[5px] text-xs text-danger">
                        휴식 종료는 시작보다 늦어야 합니다.
                    </p>
                )}
                {breakRangeInvalid && (
                    <p className="px-[5px] text-xs text-danger">
                        휴식 시간은 운영시간 범위 안에 있어야 합니다.
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
                                onClick={() => onToggleBusinessDay(value)}
                                className={[
                                    'flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl text-base font-semibold transition-colors',
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
                {noBusinessDay && (
                    <p className="px-[5px] text-xs text-danger">
                        영업일을 최소 1개 이상 선택해 주세요.
                    </p>
                )}
            </div>

            {/* 편의 정보 */}
            <div className="flex flex-col gap-2">
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    편의 정보
                </span>
                <div className="flex flex-col gap-2">
                    {CONVENIENCE_OPTIONS.map(({ key, label }) => (
                        <CheckboxInput
                            key={key}
                            label={label}
                            bordered
                            checked={convenienceInfo[key]}
                            onCheckedChange={() => onToggleConvenience(key)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
