'use client';

import { Slot, TextArea, TextInput } from '@todam/ui';

import { PendingImageField } from '@/shared/ui';
import { getFileValidationIssues } from '@/shared/lib/imageFile';
import { useToast } from '@/shared/model';
import { useProgramRegistrationStore } from '../model/store';
import { DESCRIPTION_MAX, DIFFICULTY_OPTIONS, TITLE_MAX } from '../model/types';

export function BasicInfoStep() {
    const form = useProgramRegistrationStore((s) => s.form);
    const patch = useProgramRegistrationStore((s) => s.patch);
    const addImageFiles = useProgramRegistrationStore((s) => s.addImageFiles);
    const removeImage = useProgramRegistrationStore((s) => s.removeImage);
    const { push } = useToast();
    const handleAddImages = (files: File[]) => {
        const issues = getFileValidationIssues(files);
        if (issues.oversized) {
            push({ message: '5MB를 초과한 이미지는 추가할 수 없어요. 최대 파일 용량은 5MB예요.' });
        } else if (issues.unsupported) {
            push({ message: 'JPG, PNG, HEIC 형식의 이미지만 추가할 수 있어요.' });
        }
        addImageFiles(files);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* 대표 이미지 (선택) — 전역 펜딩 필드 */}
            <PendingImageField
                label="대표 이미지"
                existingImages={[]}
                pendingImages={form.images}
                onAdd={handleAddImages}
                onRemoveExisting={() => {}}
                onRemovePending={removeImage}
                max={1}
                multiple={false}
                alt="대표 이미지"
            />

            <TextInput
                label="클래스명"
                placeholder="클래스 이름을 입력해 주세요"
                maxLength={TITLE_MAX}
                value={form.title}
                onChange={(e) => patch({ title: e.target.value })}
                autoFocus
            />

            <div className="flex flex-col gap-2">
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    난이도
                </span>
                <div className="flex gap-2">
                    {DIFFICULTY_OPTIONS.map(({ label, value }) => (
                        <Slot
                            key={value}
                            selected={form.difficulty === value}
                            onClick={() => patch({ difficulty: value })}
                            className="flex-1"
                        >
                            {label}
                        </Slot>
                    ))}
                </div>
            </div>

            <TextArea
                label="상세 설명"
                optional
                placeholder="클래스의 특징이나 진행 방식을 설명해 주세요"
                showCount
                maxLength={DESCRIPTION_MAX}
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
            />
        </div>
    );
}
