'use client';

import { CheckboxInput, TextInput } from '@todam/ui';

import { useProgramRegistrationStore } from '../model/store';

// 숫자 입력 파싱: 빈 값 → null, 그 외 정수만
const toNum = (v: string): number | null => {
    const digits = v.replace(/[^0-9]/g, '');
    return digits === '' ? null : Number(digits);
};

export function OperatingStep() {
    const form = useProgramRegistrationStore((s) => s.form);
    const patch = useProgramRegistrationStore((s) => s.patch);

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
                <TextInput
                    label="소요 시간 (분)"
                    inputMode="numeric"
                    placeholder="예) 120"
                    value={form.durationMinutes === null ? '' : String(form.durationMinutes)}
                    onChange={(e) => patch({ durationMinutes: toNum(e.target.value) })}
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
                    checked={form.childrenAllowed}
                    onCheckedChange={(v) => patch({ childrenAllowed: v })}
                />
                <CheckboxInput
                    bordered
                    label="택배 배송 가능"
                    checked={form.deliveryAvailable}
                    onCheckedChange={(v) => patch({ deliveryAvailable: v })}
                />
            </div>
        </div>
    );
}
