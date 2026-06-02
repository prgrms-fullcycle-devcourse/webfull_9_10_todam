'use client';

import { ALLOWED_IMAGE_TYPES } from '@todam/shared';
import { CameraIcon, CloseIcon } from '@todam/ui';
import { useRef, type ChangeEvent } from 'react';

export type ImageUploadCellProps = {
    // 채워진 상태 우선순위: src(이미지) > label(텍스트 chip). 둘 다 없으면 빈 상태(피커).
    src?: string;
    label?: string;
    onPick?: (files: File[]) => void;
    onRemove?: () => void;
    size?: string;
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    alt?: string;
    ariaLabel?: string;
};

// src/label 있으면 채워진 상태, 없으면 빈 상태(피커).
export function ImageUploadCell({
    src,
    label,
    onPick,
    onRemove,
    size = 'h-20 w-28',
    accept = ALLOWED_IMAGE_TYPES.join(','),
    multiple = false,
    disabled = false,
    alt = '',
    ariaLabel = '이미지 추가',
}: ImageUploadCellProps) {
    const ref = useRef<HTMLInputElement>(null);

    // 우상단 삭제 버튼. -4px 로 밖에 걸치므로 포지션 컨텍스트와 라운딩 클리핑을 분리한다.
    const removeButton = onRemove && (
        <button
            type="button"
            onClick={onRemove}
            aria-label="이미지 삭제"
            className="absolute -right-1 -top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-foreground-secondary text-foreground-inverse"
        >
            <CloseIcon size={14} />
        </button>
    );

    // 채워진 상태: 이미지(src) 또는 텍스트 chip(label).
    if (src || label) {
        return (
            <div className={`relative ${size}`}>
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-muted">
                    {src ? (
                        <img src={src} alt={alt} className="h-full w-full object-cover" />
                    ) : (
                        <span className="truncate px-2 text-xs text-foreground-tertiary">
                            {label}
                        </span>
                    )}
                </div>
                {removeButton}
            </div>
        );
    }

    // 빈 상태: 점선 박스 + 카메라. 클릭 시 파일 선택.
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onPick?.(Array.from(e.target.files ?? []));
        e.target.value = '';
    };

    return (
        <>
            <input
                ref={ref}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                onChange={handleChange}
            />
            <button
                type="button"
                aria-label={ariaLabel}
                disabled={disabled}
                onClick={() => ref.current?.click()}
                className={`flex ${size} cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border text-foreground-tertiary disabled:cursor-not-allowed disabled:opacity-50`}
            >
                <CameraIcon size={24} />
            </button>
        </>
    );
}
