'use client';

import { useCallback } from 'react';

import { openPostcode } from '../lib/daumPostcode';

// 주소 input. 클릭 시 Daum 우편번호 팝업 → resolve 결과로 postalCode + address 동시 set.
// Figma 정본: 주소 미완료 = placeholder "도로명 또는 지번 주소를 검색해 주세요" (status=default).
// 클릭 가능한 readonly input. helperText 는 에러 상태에서만 노출.
export type AddressSearchInputProps = {
    label?: string;
    value: string;
    helperText?: string;
    error?: boolean;
    disabled?: boolean;
    onResolved: (next: { postalCode: string; address: string }) => void;
};

export function AddressSearchInput({
    label,
    value,
    helperText,
    error,
    disabled,
    onResolved,
}: AddressSearchInputProps) {
    const handleClick = useCallback(async () => {
        try {
            const result = await openPostcode();
            if (!result) return; // 사용자가 선택 없이 닫음
            onResolved({ postalCode: result.zonecode, address: result.roadAddress });
        } catch {
            // openPostcode 스크립트 로드 실패 등 — 호출측이 에러 토스트 처리하지 않으므로 조용히 무시.
            // (사용자가 팝업 닫기로 미선택 시에는 resolve 미발생 — 폼 상태 유지)
        }
    }, [onResolved]);

    const placeholder = '도로명 또는 지번 주소를 검색해 주세요';
    const borderClass = error ? 'border-danger' : 'border-border-subtle';

    return (
        <div className="flex w-full flex-col gap-2">
            {label && (
                <label className="px-1 text-sm font-semibold text-foreground-tertiary">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={handleClick}
                disabled={disabled}
                className={`flex h-12 w-full items-center rounded-xl border bg-surface px-4 text-left text-base transition-colors duration-200 ease-in-out focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground-secondary ${borderClass} ${
                    value ? 'text-foreground' : 'text-foreground-tertiary'
                }`}
            >
                {value || placeholder}
            </button>
            {helperText && <p className="px-1 text-xs text-danger">{helperText}</p>}
        </div>
    );
}
