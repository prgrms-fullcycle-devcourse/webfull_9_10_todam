import { ProgramDifficulty } from '@todam/shared';

// 폼 제약·난이도 옵션은 entities/program 단일 출처에서 재노출.
export {
    TITLE_MIN,
    TITLE_MAX,
    DESCRIPTION_MAX,
    DIFFICULTY_OPTIONS,
} from '../../../../entities/program';

// 클래스 등록 2단계. (이번 구현: 1단계 기본정보. 2단계 운영정보는 후행)
export enum ProgramRegistrationStep {
    BasicInfo = 0, // 기본 정보
    Operating = 1, // 운영 정보
}

export const STEP_TITLES: Record<ProgramRegistrationStep, string> = {
    [ProgramRegistrationStep.BasicInfo]: '기본 정보',
    [ProgramRegistrationStep.Operating]: '운영 정보',
};

export const TOTAL_STEPS = 2;

export interface ProgramRegistrationForm {
    // 1단계: 기본 정보
    thumbnailUrl: string | null; // 대표 이미지 (presigned 후행 → 현재 mock url, 선택)
    title: string;
    difficulty: ProgramDifficulty;
    description: string; // 선택, 최대 1000자

    // 2단계: 운영 정보 (미입력 = null)
    price: number | null; // 양의 정수 (원)
    durationMinutes: number | null; // 30~480, 30분 단위
    capacity: number | null; // 1~30
    leadTimeDays: number | null; // 0일 이상
    childFriendly: boolean; // 어린이 동반 가능
    deliverable: boolean; // 택배 배송 가능
}
