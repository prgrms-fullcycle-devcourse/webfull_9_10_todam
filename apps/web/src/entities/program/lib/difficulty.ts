import { ProgramDifficulty } from '@todam/shared';

// 난이도 표시 label ↔ contract enum 매핑 (표시 순서 = 기본/중급/심화).
// 등록·수정·상세 화면 공통 단일 출처.
export const DIFFICULTY_OPTIONS: { value: ProgramDifficulty; label: string }[] = [
    { value: ProgramDifficulty.BASIC, label: '기본' },
    { value: ProgramDifficulty.INTERMEDIATE, label: '중급' },
    { value: ProgramDifficulty.ADVANCED, label: '심화' },
];

export const DIFFICULTY_LABEL: Record<ProgramDifficulty, string> = {
    [ProgramDifficulty.BASIC]: '기본',
    [ProgramDifficulty.INTERMEDIATE]: '중급',
    [ProgramDifficulty.ADVANCED]: '심화',
};

export function getDifficultyLabel(difficulty: ProgramDifficulty): string {
    return DIFFICULTY_LABEL[difficulty];
}
