'use client';

import { useState } from 'react';

import { Counter, StandardBottomSheet } from '@todam/ui';

export interface ParticipantSheetProps {
    initial: number;
    max: number;
    onConfirm: (count: number) => void;
}

export function ParticipantSheet({ initial, max, onConfirm }: ParticipantSheetProps) {
    const [count, setCount] = useState(() => Math.min(Math.max(1, initial), max));

    return (
        <StandardBottomSheet
            title="함께할 인원을 알려주세요"
            subTitle={`최대 ${max}명까지 예약할 수 있어요.`}
            actionLabel="예약 날짜 선택하기"
            onAction={() => onConfirm(count)}
        >
            <Counter
                value={count}
                onChange={setCount}
                min={1}
                max={max}
                className="w-full justify-between"
            />
        </StandardBottomSheet>
    );
}
