'use client';

import { useState } from 'react';
import { Checkbox, TextInput } from '@todam/ui';
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
    // 내 프로필에 저장된 예약자 정보(이름/연락처). 있으면 "내 정보 불러오기" 체크박스 노출.
    myInfo?: { name: string; phone: string } | null;
};

export function DeliveryForm({
    values,
    errors,
    onChange,
    onAddressResolved,
    disabled,
    myInfo,
}: DeliveryFormProps) {
    const hasAddress = Boolean(values.address);

    // "내 정보 불러오기" — 체크 시 수령인 이름/연락처를 저장된 예약자 정보로 채우고, 해제 시 비운다.
    // 초기 수령인 정보가 이미 저장된 내 정보와 같으면(예약자 정보로 프리필된 경우) 체크 상태로 시작.
    const [loadMyInfo, setLoadMyInfo] = useState(
        () =>
            !!myInfo &&
            values.recipientName === myInfo.name &&
            values.recipientPhone === myInfo.phone,
    );
    const handleToggleLoadMyInfo = (checked: boolean) => {
        if (disabled || !myInfo) return;
        setLoadMyInfo(checked);
        onChange('recipientName', checked ? myInfo.name : '');
        onChange('recipientPhone', checked ? myInfo.phone : '');
    };

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

            {/* 내 정보 불러오기 — 저장된 예약자 정보가 있을 때만 노출.
                바깥 div 가 클릭을 소유하고 Checkbox 는 pointer-events-none presentational. */}
            {myInfo && (
                <div
                    role="checkbox"
                    aria-checked={loadMyInfo}
                    aria-disabled={disabled}
                    tabIndex={disabled ? -1 : 0}
                    onClick={() => handleToggleLoadMyInfo(!loadMyInfo)}
                    onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            handleToggleLoadMyInfo(!loadMyInfo);
                        }
                    }}
                    className="flex cursor-pointer items-center gap-1 self-start py-1 text-sm font-semibold text-foreground-secondary aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                >
                    <Checkbox
                        checked={loadMyInfo}
                        aria-hidden
                        tabIndex={-1}
                        className="pointer-events-none"
                    />
                    내 정보 불러오기
                </div>
            )}

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
