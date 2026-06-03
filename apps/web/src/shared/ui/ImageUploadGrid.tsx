'use client';

import { ImageUploadCell } from './ImageUploadCell';

export type ImageUploadGridItem = {
    src?: string;
    label?: string;
    key?: string;
    alt?: string;
    onRemove?: () => void;
};

export type ImageUploadGridProps = {
    items: ImageUploadGridItem[];
    onAdd: (files: File[]) => void;
    // 최대 장수. items.length < max 일 때만 추가 셀 노출.
    max?: number;
    multiple?: boolean;
    accept?: string;
    // 추가 셀 비활성 (업로드 중 등).
    addDisabled?: boolean;
    // 셀 크기. 미지정 시 ImageUploadCell 기본(w-28 h-20).
    cellSize?: string;
    className?: string;
};

// 고정 크기 셀을 flex-wrap 배치 → 너비 넘으면 줄바꿈. 1장이든 N장이든 동일.
const CONTAINER = 'flex flex-wrap gap-4';

// 채워진 셀 N개 + 추가 셀.
export function ImageUploadGrid({
    items,
    onAdd,
    max = 5,
    multiple = true,
    accept,
    addDisabled = false,
    cellSize,
    className = CONTAINER,
}: ImageUploadGridProps) {
    const canAdd = items.length < max;

    return (
        <div className={className}>
            {items.map((item, i) => (
                <ImageUploadCell
                    key={item.key ?? i}
                    src={item.src}
                    label={item.label}
                    alt={item.alt}
                    size={cellSize}
                    onRemove={item.onRemove}
                />
            ))}
            {canAdd && (
                <ImageUploadCell
                    onPick={onAdd}
                    size={cellSize}
                    multiple={multiple}
                    accept={accept}
                    disabled={addDisabled}
                />
            )}
        </div>
    );
}
