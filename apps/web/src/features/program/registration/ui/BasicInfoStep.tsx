'use client';

import { Slot, TextArea, TextInput } from '@todam/ui';

import { ImageUploadField, type ImageUploadGridItem } from '../../../../shared/ui';
import { useProgramRegistrationStore } from '../model/store';
import { DESCRIPTION_MAX, DIFFICULTY_OPTIONS, TITLE_MAX } from '../model/types';

export function BasicInfoStep() {
    const form = useProgramRegistrationStore((s) => s.form);
    const patch = useProgramRegistrationStore((s) => s.patch);

    const handleAdd = (files: File[]) => {
        const file = files[0];
        // TODO(presigned 후행): 실제 업로드 후 url 저장. 현재 mock url.
        if (file) patch({ thumbnailUrl: `mock://program/${file.name}` });
    };

    // mock 단계: 실제 이미지 없이 파일명만 label 로 표기.
    const items: ImageUploadGridItem[] = form.thumbnailUrl
        ? [
              {
                  label: form.thumbnailUrl.replace('mock://program/', ''),
                  onRemove: () => patch({ thumbnailUrl: null }),
              },
          ]
        : [];

    return (
        <div className="flex flex-col gap-4">
            {/* 대표 이미지 (선택) */}
            <ImageUploadField label="대표 이미지" items={items} onAdd={handleAdd} max={1} />

            <TextInput
                label="클래스명"
                placeholder="클래스 이름을 입력해 주세요"
                maxLength={TITLE_MAX}
                value={form.title}
                onChange={(e) => patch({ title: e.target.value })}
            />

            {/* 난이도 (3개 분리 버튼, 선택=검정 채움) */}
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
