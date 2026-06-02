'use client';

import type { ReactNode } from 'react';

import { ImageUploadGrid, type ImageUploadGridProps } from './ImageUploadGrid';

export type ImageUploadFieldProps = ImageUploadGridProps & {
    label?: ReactNode;
    // 라벨 옆 보조 텍스트 (예: "(최대 5장)").
    hint?: ReactNode;
};

// 폼 입력 필드형 이미지 업로드: 라벨 + ImageUploadGrid. 1장/N장 동일 사용.
export function ImageUploadField({ label, hint, ...gridProps }: ImageUploadFieldProps) {
    return (
        <div className="flex flex-col gap-2">
            {(label || hint) && (
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    {label}
                    {hint && <span className="ml-1 font-normal">{hint}</span>}
                </span>
            )}
            <ImageUploadGrid {...gridProps} />
        </div>
    );
}
