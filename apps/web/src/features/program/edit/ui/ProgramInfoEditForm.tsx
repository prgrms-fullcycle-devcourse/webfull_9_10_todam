'use client';

import { Slot, TextArea, TextInput } from '@todam/ui';

import type { ProgramDifficulty } from '@todam/shared';

import { DIFFICULTY_OPTIONS, DESCRIPTION_MAX } from '../../../../entities/program';

export type ProgramInfoFields = {
    title: string;
    description: string;
    difficulty: ProgramDifficulty;
};

type Props = {
    fields: ProgramInfoFields;
    errors: Partial<Record<'title' | 'description', string>>;
    onChange: (patch: Partial<ProgramInfoFields>) => void;
};

// 기본 정보(클래스명·난이도·상세설명) 입력 필드. 이미지는 ProgramImageField가 담당.
export function ProgramInfoEditForm({ fields, errors, onChange }: Props) {
    return (
        <div className="flex flex-col gap-4">
            {/* 클래스명 */}
            <TextInput
                label="클래스명"
                required
                placeholder="클래스 이름을 입력해 주세요"
                value={fields.title}
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
                    {DIFFICULTY_OPTIONS.map(({ value, label }) => (
                        <Slot
                            key={value}
                            selected={fields.difficulty === value}
                            onClick={() => onChange({ difficulty: value })}
                            className="flex-1"
                        >
                            {label}
                        </Slot>
                    ))}
                </div>
            </div>

            {/* 상세 설명 */}
            <TextArea
                label="상세 설명"
                placeholder="클래스의 특징, 준비물 등을 자유롭게 소개해 주세요"
                showCount
                maxLength={DESCRIPTION_MAX}
                value={fields.description}
                error={!!errors.description}
                helperText={errors.description}
                onChange={(e) => onChange({ description: e.target.value })}
            />
        </div>
    );
}
