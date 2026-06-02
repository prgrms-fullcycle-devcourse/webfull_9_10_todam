'use client';

import { MAX_PROGRAM_IMAGE_COUNT, type ProgramImage } from '@todam/shared';

import { ImageUploadField, type ImageUploadGridItem } from '../../../../shared/ui';
import type { ExistingImage, PendingImage } from '../../../../shared/model';

type Props = {
    existingImages: (ProgramImage & ExistingImage)[];
    pendingImages: PendingImage[];
    onAdd: (files: File[]) => void;
    onRemoveExisting: (id: string) => void;
    onRemovePending: (index: number) => void;
};

// 클래스 대표 이미지. 기존/신규를 그리드 아이템으로 합쳐 ImageUploadField 에 위임.
export function ProgramImageField({
    existingImages,
    pendingImages,
    onAdd,
    onRemoveExisting,
    onRemovePending,
}: Props) {
    const items: ImageUploadGridItem[] = [
        ...existingImages.map((img) => ({
            src: img.thumbnailUrl,
            key: img.id,
            alt: '클래스 이미지',
            onRemove: () => onRemoveExisting(img.id),
        })),
        ...pendingImages.map((p, i) => ({
            src: p.previewUrl,
            key: p.previewUrl,
            alt: '신규 이미지 미리보기',
            onRemove: () => onRemovePending(i),
        })),
    ];

    return (
        <ImageUploadField
            label="클래스 이미지"
            items={items}
            onAdd={onAdd}
            max={MAX_PROGRAM_IMAGE_COUNT}
            multiple={false}
        />
    );
}
