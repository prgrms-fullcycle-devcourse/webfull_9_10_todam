'use client';

import { useState } from 'react';
import { RadioInput, StandardBottomSheet } from '@todam/ui';
import { formatKoreanMonthDayWithWeekday } from '@todam/shared';

type Scope = 'ALL_DAY' | 'TIME_SLOTS';

type ScopeOption = {
    value: Scope;
    title: string;
    description: string;
};

const SCOPE_OPTIONS: ScopeOption[] = [
    {
        value: 'ALL_DAY',
        title: '종일',
        description: '선택한 날짜에 모든 신규 예약을 받지 않을게요.',
    },
    {
        value: 'TIME_SLOTS',
        title: '시간대 선택',
        description: '예약을 제한할 시간를 직접 선택할게요.',
    },
];

type Props = {
    date: string;
    initialScope?: Scope;
    onNext: (scope: Scope) => void;
};

export function RestrictionScopeBottomSheet({ date, initialScope = 'ALL_DAY', onNext }: Props) {
    const [selected, setSelected] = useState<Scope>(initialScope);

    return (
        <StandardBottomSheet
            title={formatKoreanMonthDayWithWeekday(date)}
            subTitle="예약 제한 범위를 선택해 주세요."
            actionLabel="다음"
            onAction={() => onNext(selected)}
        >
            <div role="radiogroup" className="flex flex-col gap-3">
                {SCOPE_OPTIONS.map((option) => (
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
