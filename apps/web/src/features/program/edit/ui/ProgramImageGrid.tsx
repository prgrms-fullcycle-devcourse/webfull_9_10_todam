'use client';

import { CameraIcon, CloseIcon } from '@todam/ui';
import { useRef, type ChangeEvent } from 'react';

import type { ProgramImage } from '@todam/shared';

import { ALLOWED_IMAGE_TYPES, MAX_PROGRAM_IMAGES } from '../lib/imageFile';
import type { PendingImage } from '../model/types';

type Props = {
    existingImages: ProgramImage[];
    pendingImages: PendingImage[];
    onAdd: (files: File[]) => void;
    onRemoveExisting: (imageId: string) => void;
    onRemovePending: (index: number) => void;
};

// 기존 + 신규 대기 이미지 그리드 + 추가 버튼. 파일 검증은 onAdd(usePendingImages) 측에서 수행.
export function ProgramImageGrid({
    existingImages,
    pendingImages,
    onAdd,
    onRemoveExisting,
    onRemovePending,
}: Props) {
    const imgRef = useRef<HTMLInputElement>(null);
    const canAddMore = existingImages.length + pendingImages.length < MAX_PROGRAM_IMAGES;

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        onAdd(Array.from(e.target.files ?? []));
        e.target.value = '';
    };

    return (
        <div className="flex flex-col gap-2">
            <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                클래스 이미지 (최대 {MAX_PROGRAM_IMAGES}장)
            </span>
            <input
                ref={imgRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                multiple
                className="hidden"
                onChange={handleFileChange}
            />
            <div className="grid grid-cols-2 gap-3">
                {/* 기존 이미지 */}
                {existingImages.map((img) => (
                    <div
                        key={img.programImageId}
                        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-muted"
                    >
                        <img
                            src={img.thumbnailUrl}
                            alt="클래스 이미지"
                            className="h-full w-full object-cover"
                        />
                        {img.isThumbnail && (
                            <span className="absolute left-2 top-2 rounded-lg bg-inverse/70 px-2 py-0.5 text-xs font-semibold text-foreground-inverse">
                                대표
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => onRemoveExisting(img.programImageId)}
                            aria-label="이미지 삭제"
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-inverse/60 text-foreground-inverse"
                        >
                            <CloseIcon size={14} />
                        </button>
                    </div>
                ))}
                {/* 신규 업로드 대기 이미지 */}
                {pendingImages.map((p, i) => (
                    <div
                        key={p.previewUrl}
                        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-muted"
                    >
                        <img
                            src={p.previewUrl}
                            alt="신규 이미지 미리보기"
                            className="h-full w-full object-cover"
                        />
                        {p.isThumbnail && (
                            <span className="absolute left-2 top-2 rounded-lg bg-inverse/70 px-2 py-0.5 text-xs font-semibold text-foreground-inverse">
                                대표
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => onRemovePending(i)}
                            aria-label="이미지 삭제"
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-inverse/60 text-foreground-inverse"
                        >
                            <CloseIcon size={14} />
                        </button>
                    </div>
                ))}
                {/* 추가 버튼 */}
                {canAddMore && (
                    <button
                        type="button"
                        onClick={() => imgRef.current?.click()}
                        className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl border border-dashed border-border text-foreground-tertiary"
                    >
                        <CameraIcon size={24} />
                    </button>
                )}
            </div>
        </div>
    );
}
