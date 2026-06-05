'use client';

import type { ArtworkPhoto } from '@todam/shared';

// 단계별 사진 가로 스크롤 (Figma `8505:16209`).
// - Layout: horizontal, gap 8.
// - MediaItem box: 64×64, radius 8, bg-muted (#F1F2F4).
// - IMG 라벨 tag: 44×20, radius 4, padding (2 6), bg-surface, color foreground-secondary.
//   plan §Design tokens 표 기준.
export type StepperItemMediaProps = {
    photos: ArtworkPhoto[];
    onSelect: (photo: ArtworkPhoto) => void;
};

export function StepperItemMedia({ photos, onSelect }: StepperItemMediaProps) {
    if (photos.length === 0) return null;
    return (
        <div className="flex gap-2 overflow-x-auto">
            {photos.map((photo, idx) => (
                <button
                    type="button"
                    key={`${photo.thumbnailUrl}-${idx}`}
                    onClick={() => onSelect(photo)}
                    aria-label={`작품 이미지 ${idx + 1} 확대 보기`}
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"
                >
                    <img src={photo.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    <span
                        className="absolute left-1 top-1 flex h-5 w-11 items-center justify-center rounded bg-surface text-[10px] font-medium leading-[15px] text-foreground-secondary"
                        aria-hidden="true"
                    >
                        IMG
                    </span>
                </button>
            ))}
        </div>
    );
}
