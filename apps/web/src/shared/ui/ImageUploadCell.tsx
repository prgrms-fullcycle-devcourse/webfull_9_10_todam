'use client';

import { ALLOWED_IMAGE_TYPES } from '@todam/shared';
import { CameraIcon, CloseIcon } from '@todam/ui';
import { useRef, type ChangeEvent } from 'react';

export type ImageUploadCellProps = {
    src?: string;
    onPick?: (files: File[]) => void;
    onRemove?: () => void;
    size?: string;
    accept?: string;
    multiple?: boolean;
    alt?: string;
    ariaLabel?: string;
};

// 이미지 주소값 있으면 채워진 상태, 없으면 빈 상태
export function ImageUploadCell({
    src,
    onPick,
    onRemove,
    size = 'h-20 w-28',
    accept = ALLOWED_IMAGE_TYPES.join(','),
    multiple = false,
    alt = '',
    ariaLabel = '이미지 추가',
}: ImageUploadCellProps) {
    const ref = useRef<HTMLInputElement>(null);

    // 채워진 상태: 이미지 + 우상단 삭제. 삭제 버튼이 -4px 로 밖에 걸치므로
    // 포지션 컨텍스트(div)와 라운딩 클리핑(내부 div)을 분리한다.
    if (src) {
        return (
            <div className={`relative ${size}`}>
                <div className="h-full w-full overflow-hidden rounded-2xl bg-muted">
                    <img src={src} alt={alt} className="h-full w-full object-cover" />
                </div>
                {onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        aria-label="이미지 삭제"
                        className="absolute -right-1 -top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-foreground-secondary text-foreground-inverse"
                    >
                        <CloseIcon size={14} />
                    </button>
                )}
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
                onClick={() => ref.current?.click()}
                className={`flex ${size} cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border text-foreground-tertiary`}
            >
                <CameraIcon size={24} />
            </button>
        </>
    );
}
