'use client';

import { useEffect, useState } from 'react';

import { CheckboxInput, TextInput } from '@todam/ui';

import { useProgramRegistrationStore } from '../model/store';

// 숫자 입력 파싱: 빈 값 → null, 그 외 정수만
const toNum = (v: string): number | null => {
    const digits = v.replace(/[^0-9]/g, '');
    return digits === '' ? null : Number(digits);
};

// 소요 시간 제약 (BE create-program.dto)
const DURATION_MIN = 30;
const DURATION_MAX = 480;
const DURATION_HINT = '30분부터 480분(8시간)까지 입력할 수 있어요';

function durationErrorMessage(value: number): string | null {
    if (value < DURATION_MIN) return `소요 시간은 최소 ${DURATION_MIN}분부터 등록할 수 있어요`;
    if (value > DURATION_MAX)
        return `소요 시간은 최대 ${DURATION_MAX}분(8시간)까지 등록할 수 있어요`;
    return null;
}

export function OperatingStep() {
    const form = useProgramRegistrationStore((s) => s.form);
    const patch = useProgramRegistrationStore((s) => s.patch);

    // 소요 시간 실시간 유효성 피드백. 입력 멈춘 뒤 400ms 후 범위 검사
    const [durationError, setDurationError] = useState<string | null>(null);
    const duration = form.durationMinutes;
    useEffect(() => {
        const t = setTimeout(() => {
            setDurationError(duration === null ? null : durationErrorMessage(duration));
        }, 400);
        return () => clearTimeout(t);
    }, [duration]);

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
                <TextInput
                    label="소요 시간 (분)"
                    inputMode="numeric"
                    placeholder="예) 120"
                    error={!!durationError}
                    helperText={durationError ?? DURATION_HINT}
                    value={form.durationMinutes === null ? '' : String(form.durationMinutes)}
                    onChange={(e) => patch({ durationMinutes: toNum(e.target.value) })}
                    autoFocus
                />
                <TextInput
                    label="리드타임 (일)"
                    inputMode="numeric"
                    placeholder="평균 소요일"
                    value={form.leadTimeDays === null ? '' : String(form.leadTimeDays)}
                    onChange={(e) => patch({ leadTimeDays: toNum(e.target.value) })}
                />
            </div>
            <TextInput
                label="가격(원)"
                inputMode="numeric"
                placeholder="예) 30,000"
                value={form.price === null ? '' : form.price.toLocaleString()}
                onChange={(e) => patch({ price: toNum(e.target.value) })}
            />

            <div className="flex flex-col gap-3">
                <CheckboxInput
                    bordered
                    label="어린이 동반 가능"
                    checked={form.childFriendly}
                    onCheckedChange={(v) => patch({ childFriendly: v })}
                />
                <CheckboxInput
                    bordered
                    label="택배 배송 가능"
                    checked={form.deliverable}
                    onCheckedChange={(v) => patch({ deliverable: v })}
                />
            </div>
        </div>
    );
}
