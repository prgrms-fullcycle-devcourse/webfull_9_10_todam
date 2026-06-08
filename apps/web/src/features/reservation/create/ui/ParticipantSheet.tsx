'use client';

import { useState } from 'react';

import { Counter, FormBottomSheet } from '@todam/ui';

// 예약 진입 시 가장 먼저 노출되는 "함께할 인원" 바텀시트.
// 디자인(클래스 - 예약 생성)상 인원 선택이 날짜 선택보다 선행한다.
// 슬롯별 잔여 정원(remainingCount)은 슬롯 선택 후에야 알 수 있으므로,
// 여기서는 상품 공통 상한(MAX_PARTICIPANTS)까지만 받고, 잔여 초과 검증은 최종 제출 단계에서 한다.

export const MAX_PARTICIPANTS = 4;

export interface ParticipantSheetProps {
    /** 시트 진입 시 초기 인원 */
    initial: number;
    /** "예약 날짜 선택하기" 확정 시. 닫기는 호출부에서 처리 */
    onConfirm: (count: number) => void;
}

export function ParticipantSheet({ initial, onConfirm }: ParticipantSheetProps) {
    const [count, setCount] = useState(() => Math.min(Math.max(1, initial), MAX_PARTICIPANTS));

    return (
        <FormBottomSheet
            title="함께할 인원을 알려주세요"
            subTitle={`최대 ${MAX_PARTICIPANTS}명까지 예약할 수 있어요.`}
            actionLabel="예약 날짜 선택하기"
            onAction={() => onConfirm(count)}
        >
            <Counter
                value={count}
                onChange={setCount}
                min={1}
                max={MAX_PARTICIPANTS}
                className="w-full justify-between"
            />
        </FormBottomSheet>
    );
}
