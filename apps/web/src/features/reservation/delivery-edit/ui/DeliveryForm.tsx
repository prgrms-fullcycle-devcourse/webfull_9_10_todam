'use client';

import { TextInput } from '@todam/ui';
import type { DeliveryEditRequest } from '@todam/shared';

import { AddressSearchInput } from '@/shared/ui';

// 폼 필드 5개를 한 군데에서 표현. 부모(DeliveryEditClient)가 state·errors·핸들러를 주입.
// Figma 정본 (8505:17378 / 8505:19175):
//   - [이름] / [연락처] / [주소 검색] / (조건부)[상세주소]
//   - 상세주소는 주소 검색 완료 후 동적 노출. label 숨김 — 주소 input 과 sub-frame gap 4.
//   - 연락처 keyboard = number (Figma Description #2) → inputMode="numeric"
export type DeliveryFormErrors = Partial<Record<keyof DeliveryEditRequest, string>>;

export type DeliveryFormProps = {
    values: DeliveryEditRequest;
    errors: DeliveryFormErrors;
    onChange: <K extends keyof DeliveryEditRequest>(
        field: K,
        value: DeliveryEditRequest[K],
    ) => void;
    onAddressResolved: (next: { postalCode: string; address: string }) => void;
    disabled?: boolean;
};

export function DeliveryForm({
    values,
    errors,
    onChange,
    onAddressResolved,
    disabled,
}: DeliveryFormProps) {
    const hasAddress = Boolean(values.address);

    return (
        <div className="flex w-full flex-col gap-2">
            <TextInput
                id="delivery-recipient-name"
                label="이름"
                value={values.recipientName}
                onChange={(e) => onChange('recipientName', e.target.value)}
                placeholder="이름을 입력해 주세요"
                helperText={errors.recipientName}
                error={Boolean(errors.recipientName)}
                disabled={disabled}
            />
            <TextInput
                id="delivery-recipient-phone"
                label="연락처"
                inputMode="numeric"
                value={values.recipientPhone}
                onChange={(e) => onChange('recipientPhone', e.target.value)}
                placeholder="010-0000-0000"
                helperText={errors.recipientPhone}
                error={Boolean(errors.recipientPhone)}
                disabled={disabled}
            />

            {/* 주소 + (조건부)상세주소 sub-frame — Figma gap 4(= gap-1) */}
            <div className="flex w-full flex-col gap-1">
                <AddressSearchInput
                    label="주소"
                    value={values.address}
                    helperText={errors.address ?? errors.postalCode}
                    error={Boolean(errors.address ?? errors.postalCode)}
                    onResolved={onAddressResolved}
                />
                {hasAddress && (
                    <TextInput
                        id="delivery-address-detail"
                        value={values.addressDetail ?? ''}
                        onChange={(e) => onChange('addressDetail', e.target.value)}
                        placeholder="상세 주소를 입력해 주세요"
                        helperText={errors.addressDetail}
                        error={Boolean(errors.addressDetail)}
                        disabled={disabled}
                    />
                )}
            </div>
        </div>
    );
}
