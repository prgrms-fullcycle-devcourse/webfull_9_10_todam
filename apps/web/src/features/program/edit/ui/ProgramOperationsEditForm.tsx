'use client';

import { CheckboxInput, TextInput } from '@todam/ui';

import { ProgramDeliveryOption } from '@todam/shared';

import type { ProgramOperationsFormState } from '../model/types';

type Props = {
    form: ProgramOperationsFormState;
    errors: Partial<Record<keyof ProgramOperationsFormState, string>>;
    onChange: (patch: Partial<ProgramOperationsFormState>) => void;
};

// 숫자 입력 헬퍼: 0이면 빈 값으로 표시
const numValue = (n: number) => (n === 0 ? '' : String(n));

export function ProgramOperationsEditForm({ form, errors, onChange }: Props) {
    // 해당 클래스가 배송 가능한 경우에만 택배 옵션 노출
    const deliveryCapable =
        form.deliveryOption === ProgramDeliveryOption.DELIVERY ||
        form.deliveryOption === ProgramDeliveryOption.CUSTOMER_SELECT;

    return (
        <div className="flex flex-col gap-4">
            {/* 가격 / 소요 시간 */}
            <div className="grid grid-cols-2 gap-3">
                <TextInput
                    label="가격(원)"
                    required
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="예) 30,000"
                    value={numValue(form.price)}
                    error={!!errors.price}
                    helperText={errors.price}
                    onChange={(e) => onChange({ price: Number(e.target.value) || 0 })}
                />
                <TextInput
                    label="소요 시간 (분)"
                    required
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="예) 120"
                    value={numValue(form.durationMinutes)}
                    error={!!errors.durationMinutes}
                    helperText={errors.durationMinutes}
                    onChange={(e) => onChange({ durationMinutes: Number(e.target.value) || 0 })}
                />
            </div>

            {/* 정원 / 리드타임 */}
            <div className="grid grid-cols-2 gap-3">
                <TextInput
                    label="정원 (명)"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="최대 인원"
                    value={numValue(form.capacity)}
                    error={!!errors.capacity}
                    helperText={errors.capacity}
                    onChange={(e) => onChange({ capacity: Number(e.target.value) || 0 })}
                />
                <TextInput
                    label="리드타임 (일)"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="평균 소요일"
                    value={numValue(form.leadTimeDays)}
                    error={!!errors.leadTimeDays}
                    helperText={errors.leadTimeDays}
                    onChange={(e) => onChange({ leadTimeDays: Number(e.target.value) || 0 })}
                />
            </div>

            {/* 어린이 동반 가능 */}
            <CheckboxInput
                bordered
                label="어린이 동반 가능"
                checked={form.childrenAllowed}
                onCheckedChange={(v) => onChange({ childrenAllowed: v })}
            />

            {/* 택배 배송 가능 — 배송 가능한 클래스에만 노출 */}
            {deliveryCapable && (
                <CheckboxInput
                    bordered
                    label="택배 배송 가능"
                    checked={form.deliveryAvailable}
                    onCheckedChange={(v) => onChange({ deliveryAvailable: v })}
                />
            )}
        </div>
    );
}
