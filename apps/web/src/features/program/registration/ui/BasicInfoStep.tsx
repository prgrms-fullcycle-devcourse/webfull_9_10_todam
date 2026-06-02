'use client';

import { CameraIcon, CloseIcon, TextArea, TextInput } from '@todam/ui';
import { useRef } from 'react';

import { useProgramRegistrationStore } from '../model/store';
import { DESCRIPTION_MAX, DIFFICULTY_OPTIONS, TITLE_MAX } from '../model/types';

export function BasicInfoStep() {
    const form = useProgramRegistrationStore((s) => s.form);
    const patch = useProgramRegistrationStore((s) => s.patch);

    const imgRef = useRef<HTMLInputElement>(null);

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // TODO(presigned 후행): 실제 업로드 후 url 저장. 현재 mock url.
        if (file) patch({ thumbnailUrl: `mock://program/${file.name}` });
        e.target.value = '';
    };

    return (
        <div className="flex flex-col gap-4">
            {/* 대표 이미지 (선택) */}
            <div className="flex flex-col gap-2">
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    대표 이미지
                </span>
                <input
                    ref={imgRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic"
                    className="hidden"
                    onChange={handleImage}
                />
                {form.thumbnailUrl ? (
                    <div className="relative flex h-20 w-28 items-center justify-center rounded-2xl bg-muted text-xs text-foreground-tertiary">
                        <span className="truncate px-2">
                            {form.thumbnailUrl.replace('mock://program/', '')}
                        </span>
                        <button
                            type="button"
                            onClick={() => patch({ thumbnailUrl: null })}
                            aria-label="이미지 삭제"
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-inverse/60 text-foreground-inverse"
                        >
                            <CloseIcon size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => imgRef.current?.click()}
                        aria-label="대표 이미지 추가"
                        className="flex h-20 w-28 flex-col items-center justify-center rounded-2xl border border-dashed border-border text-foreground-tertiary"
                    >
                        <CameraIcon size={24} />
                    </button>
                )}
            </div>

            <TextInput
                label="클래스명"
                required
                placeholder="클래스 이름을 입력해 주세요"
                maxLength={TITLE_MAX}
                value={form.title}
                onChange={(e) => patch({ title: e.target.value })}
            />

            {/* 난이도 (3개 분리 버튼, 선택=검정 채움) */}
            <div className="flex flex-col gap-2">
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    난이도 <span className="text-danger">*</span>
                </span>
                <div className="flex gap-2">
                    {DIFFICULTY_OPTIONS.map(({ label, value }) => {
                        const selected = form.difficulty === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => patch({ difficulty: value })}
                                className={[
                                    'flex h-12 flex-1 items-center justify-center rounded-2xl text-base transition-colors',
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

            <TextArea
                label="상세 설명 (선택)"
                placeholder="클래스의 특징이나 진행 방식을 설명해 주세요"
                showCount
                maxLength={DESCRIPTION_MAX}
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
            />
        </div>
    );
}
