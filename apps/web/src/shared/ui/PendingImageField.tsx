'use client';

import type { ReactNode } from 'react';

import type { ExistingImage, PendingImage } from '../model';
import { ImageUploadField } from './ImageUploadField';
import type { ImageUploadGridItem } from './ImageUploadGrid';

export type PendingImageFieldProps = {
    label?: ReactNode;
    hint?: ReactNode;
    existingImages: ExistingImage[];
    pendingImages: PendingImage[];
    onAdd: (files: File[]) => void;
    onRemoveExisting: (id: string) => void;
    onRemovePending: (index: number) => void;
    max?: number;
    multiple?: boolean;
    accept?: string;
    addDisabled?: boolean;
    // 셀 alt 텍스트 (도메인별 문구).
    alt?: string;
};

// 기존(서버)·신규(대기) 이미지를 grid item 으로 합쳐 ImageUploadField 에 위임.
// usePendingImages 출력(existing/pending/handlers)을 그대로 받아 items 매핑을 단일화한다.
export function PendingImageField({
    label,
    hint,
    existingImages,
    pendingImages,
    onAdd,
    onRemoveExisting,
    onRemovePending,
    max,
    multiple = false,
    accept,
    addDisabled,
    alt = '이미지',
}: PendingImageFieldProps) {
    const items: ImageUploadGridItem[] = [
        ...existingImages.map((img) => ({
            src: img.src,
            key: img.id,
            alt,
            onRemove: () => onRemoveExisting(img.id),
        })),
        ...pendingImages.map((p, i) => ({
            src: p.previewUrl,
            key: p.previewUrl,
            alt: `${alt} 미리보기`,
            onRemove: () => onRemovePending(i),
        })),
    ];

    return (
        <ImageUploadField
            label={label}
            hint={hint}
            items={items}
            onAdd={onAdd}
            max={max}
            multiple={multiple}
            accept={accept}
            addDisabled={addDisabled}
        />
    );
}
