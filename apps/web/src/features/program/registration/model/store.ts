import { MAX_PROGRAM_IMAGE_COUNT, ProgramDifficulty } from '@todam/shared';
import { create } from 'zustand';

import { filterValidImageFiles } from '@/shared/lib/imageFile';
import type { PendingImage } from '@/shared/model';
import {
    ProgramRegistrationStep,
    TITLE_MAX,
    TITLE_MIN,
    type ProgramRegistrationForm,
} from './types';

function initialForm(): ProgramRegistrationForm {
    return {
        images: [],
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
    addImageFiles: (files: File[]) => void;
    removeImage: (index: number) => void;
    reset: () => void;
}

export const useProgramRegistrationStore = create<ProgramRegistrationStore>((set) => ({
    step: ProgramRegistrationStep.BasicInfo,
    form: initialForm(),
    setStep: (step) => set({ step }),
    next: () => set((s) => ({ step: Math.min(s.step + 1, ProgramRegistrationStep.Operating) })),
    prev: () => set((s) => ({ step: Math.max(s.step - 1, ProgramRegistrationStep.BasicInfo) })),
    patch: (p) => set((s) => ({ form: { ...s.form, ...p } })),
    addImageFiles: (files) =>
        set((s) => {
            const room = MAX_PROGRAM_IMAGE_COUNT - s.form.images.length;
            if (room <= 0) return s;
            const valid = filterValidImageFiles(files).slice(0, room);
            if (valid.length === 0) return s;
            const empty = s.form.images.length === 0;
            const added: PendingImage[] = valid.map((file, i) => ({
                file,
                previewUrl: URL.createObjectURL(file),
                isThumbnail: empty && i === 0,
            }));
            return { form: { ...s.form, images: [...s.form.images, ...added] } };
        }),
    removeImage: (index) =>
        set((s) => {
            const target = s.form.images[index];
            if (target) URL.revokeObjectURL(target.previewUrl);
            return { form: { ...s.form, images: s.form.images.filter((_, i) => i !== index) } };
        }),
    reset: () =>
        set((s) => {
            s.form.images.forEach((p) => URL.revokeObjectURL(p.previewUrl));
            return { step: ProgramRegistrationStep.BasicInfo, form: initialForm() };
        }),
}));

// ─── 단계별 유효성 (필수값 충족 시 다음/저장 활성) ───────────────
export function isStepValid(form: ProgramRegistrationForm, step: ProgramRegistrationStep): boolean {
    switch (step) {
        case ProgramRegistrationStep.BasicInfo: {
            const len = form.title.trim().length;
            return len >= TITLE_MIN && len <= TITLE_MAX && !!form.difficulty;
        }
        case ProgramRegistrationStep.Operating: {
            // 소요시간 30~480분: BE DTO(create-program.dto)
            return (
                form.price !== null &&
                form.price > 0 &&
                form.durationMinutes !== null &&
                form.durationMinutes >= 30 &&
                form.durationMinutes <= 480 &&
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
        form.images.length > 0 ||
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
