'use client';

import { CameraIcon, CloseIcon, TextArea, TextInput } from '@todam/ui';
import { useRef, type ChangeEvent } from 'react';

import type { ProgramDifficulty, ProgramImage } from '@todam/shared';
import { ProgramDifficulty as Difficulty } from '@todam/shared';

import type { PendingImage, ProgramInfoFormState } from '../model/types';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES, MAX_PROGRAM_IMAGES } from '../model/types';

const DIFFICULTY_OPTIONS: { value: ProgramDifficulty; label: string }[] = [
    { value: Difficulty.BASIC, label: '기본' },
    { value: Difficulty.INTERMEDIATE, label: '중급' },
    { value: Difficulty.ADVANCED, label: '심화' },
];

type Props = {
    form: ProgramInfoFormState;
    errors: Partial<Record<keyof ProgramInfoFormState, string>>;
    onChange: (patch: Partial<ProgramInfoFormState>) => void;
    onImageAdd: (files: File[]) => void;
    onExistingImageRemove: (imageId: string) => void;
    onPendingImageRemove: (index: number) => void;
};

export function ProgramInfoEditForm({
    form,
    errors,
    onChange,
    onImageAdd,
    onExistingImageRemove,
    onPendingImageRemove,
}: Props) {
    const imgRef = useRef<HTMLInputElement>(null);

    const totalImages = form.existingImages.length + form.pendingImages.length;
    const canAddMore = totalImages < MAX_PROGRAM_IMAGES;

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        const valid = files.filter((f) => {
            if (!ALLOWED_IMAGE_TYPES.includes(f.type)) return false;
            if (f.size > MAX_FILE_SIZE_BYTES) return false;
            return true;
        });
        if (valid.length > 0) onImageAdd(valid);
        e.target.value = '';
    };

    return (
        <div className="flex flex-col gap-4">
            {/* 대표 이미지 */}
            <div className="flex flex-col gap-2">
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    클래스 이미지 (최대 {MAX_PROGRAM_IMAGES}장)
                </span>
                <input
                    ref={imgRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                />
                <div className="grid grid-cols-2 gap-3">
                    {/* 기존 이미지 */}
                    {form.existingImages.map((img: ProgramImage) => (
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
                                onClick={() => onExistingImageRemove(img.programImageId)}
                                aria-label="이미지 삭제"
                                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-inverse/60 text-foreground-inverse"
                            >
                                <CloseIcon size={14} />
                            </button>
                        </div>
                    ))}
                    {/* 신규 업로드 대기 이미지 */}
                    {form.pendingImages.map((p: PendingImage, i: number) => (
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
                                onClick={() => onPendingImageRemove(i)}
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

            {/* 클래스명 */}
            <TextInput
                label="클래스명"
                required
                placeholder="클래스 이름을 입력해 주세요"
                value={form.title}
                error={!!errors.title}
                helperText={errors.title}
                onChange={(e) => onChange({ title: e.target.value })}
            />

            {/* 난이도 */}
            <div className="flex flex-col gap-2">
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    난이도
                </span>
                <div className="flex gap-2">
                    {DIFFICULTY_OPTIONS.map(({ value, label }) => {
                        const selected = form.difficulty === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => onChange({ difficulty: value })}
                                className={[
                                    'flex h-12 flex-1 items-center justify-center rounded-2xl text-base font-medium transition-colors',
                                    selected
                                        ? 'bg-inverse font-semibold text-foreground-inverse'
                                        : 'border border-border-subtle bg-surface text-foreground-secondary',
                                ].join(' ')}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 상세 설명 */}
            <TextArea
                label="상세 설명"
                placeholder="클래스의 특징, 준비물 등을 자유롭게 소개해 주세요"
                showCount
                maxLength={1000}
                value={form.description}
                error={!!errors.description}
                helperText={errors.description}
                onChange={(e) => onChange({ description: e.target.value })}
            />
        </div>
    );
}
