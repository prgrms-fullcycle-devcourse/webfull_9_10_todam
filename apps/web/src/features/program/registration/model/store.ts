import { ProgramDifficulty } from '@todam/shared';
import { create } from 'zustand';

import {
    ProgramRegistrationStep,
    TITLE_MAX,
    TITLE_MIN,
    type ProgramRegistrationForm,
} from './types';

function initialForm(): ProgramRegistrationForm {
    return {
        thumbnailUrl: null,
        title: '',
        difficulty: ProgramDifficulty.BASIC, // 기본 선택
        description: '',
        price: null,
        durationMinutes: null,
        leadTimeDays: null,
        childFriendly: false,
        deliverable: false,
    };
}

type Patch = Partial<ProgramRegistrationForm>;

interface ProgramRegistrationStore {
    step: ProgramRegistrationStep;
    form: ProgramRegistrationForm;
    setStep: (step: ProgramRegistrationStep) => void;
    next: () => void;
    prev: () => void;
    patch: (p: Patch) => void;
    reset: () => void;
}

export const useProgramRegistrationStore = create<ProgramRegistrationStore>((set) => ({
    step: ProgramRegistrationStep.BasicInfo,
    form: initialForm(),
    setStep: (step) => set({ step }),
    next: () => set((s) => ({ step: Math.min(s.step + 1, ProgramRegistrationStep.Operating) })),
    prev: () => set((s) => ({ step: Math.max(s.step - 1, ProgramRegistrationStep.BasicInfo) })),
    patch: (p) => set((s) => ({ form: { ...s.form, ...p } })),
    reset: () => set({ step: ProgramRegistrationStep.BasicInfo, form: initialForm() }),
}));

// ─── 단계별 유효성 (필수값 충족 시 다음/저장 활성) ───────────────
export function isStepValid(form: ProgramRegistrationForm, step: ProgramRegistrationStep): boolean {
    switch (step) {
        case ProgramRegistrationStep.BasicInfo: {
            // 클래스명 2~60자 + 난이도(기본 선택값 있음). 대표 이미지·상세설명은 선택.
            const len = form.title.trim().length;
            return len >= TITLE_MIN && len <= TITLE_MAX && !!form.difficulty;
        }
        case ProgramRegistrationStep.Operating: {
            // 필수: 가격·소요시간·리드타임. 어린이동반/택배는 선택(기본 false).
            return (
                form.price !== null &&
                form.price > 0 &&
                form.durationMinutes !== null &&
                form.durationMinutes > 0 &&
                form.leadTimeDays !== null &&
                form.leadTimeDays >= 0
            );
        }
        default:
            return false;
    }
}

export function isAllValid(form: ProgramRegistrationForm): boolean {
    return (
        isStepValid(form, ProgramRegistrationStep.BasicInfo) &&
        isStepValid(form, ProgramRegistrationStep.Operating)
    );
}

// 사용자가 입력을 시작했는지 (이탈 확인 다이얼로그 판단용 — 연동 단계에서 사용)
export function isDirty(form: ProgramRegistrationForm): boolean {
    return (
        form.thumbnailUrl !== null ||
        form.title.trim().length > 0 ||
        form.description.trim().length > 0 ||
        form.difficulty !== ProgramDifficulty.BASIC ||
        form.price !== null ||
        form.durationMinutes !== null ||
        form.leadTimeDays !== null ||
        form.childFriendly ||
        form.deliverable
    );
}
