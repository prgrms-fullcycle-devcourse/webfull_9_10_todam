'use client';

import { useRouter } from 'next/navigation';

import type { PartnerProgramDetail } from '@todam/shared';

import { ApiError } from '@/shared/api';
import { useToast } from '@/shared/model/toast';
import { useEditableForm } from '@/shared/lib/useEditableForm';
import { useFormValidation } from '@/shared/lib/useFormValidation';
import { validateDurationMinutes, validatePrice } from '@/entities/program';
import { usePatchProgram } from '../queries';
import type { ProgramOperationsFormState } from '../model/types';
import { ProgramEditScaffold } from './ProgramEditScaffold';
import { ProgramOperationsEditForm } from './ProgramOperationsEditForm';

type Props = {
    programId: string;
    program: PartnerProgramDetail;
};

export function ProgramOperationsEditScreen({ programId, program }: Props) {
    const router = useRouter();
    const { push: pushToast } = useToast();

    // 서버 데이터 baseline → 폼 1회 초기화 + dirty 파생
    const baseline: ProgramOperationsFormState = {
        price: program.price,
        leadTimeDays: program.leadTimeDays,
        durationMinutes: program.durationMinutes,
        childFriendly: program.childFriendly,
        deliverable: program.deliverable,
    };
    const { form, patch, isDirty } = useEditableForm(baseline);

    // ─── 유효성 검사 ─────────────────────────────────────────────
    const { errors, validate } = useFormValidation<ProgramOperationsFormState>({
        price: validatePrice,
        durationMinutes: validateDurationMinutes,
    });

    // ─── mutation ───────────────────────────────────────────────
    const patchMutation = usePatchProgram(program.storeId, programId);
    const isSaving = patchMutation.isPending;

    // ─── 저장 ────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate(form) || isSaving) return;

        try {
            await patchMutation.mutateAsync({
                price: form.price,
                leadTimeDays: form.leadTimeDays,
                durationMinutes: form.durationMinutes,
                childFriendly: form.childFriendly,
                deliverable: form.deliverable,
            });

            pushToast({ message: '수정된 클래스 정보가 반영되었어요.' });
            // 저장 성공 → 진입 직전(상세)으로 복귀. 상세는 onSuccess invalidate 로 재조회됨.
            router.back();
        } catch (err) {
            if (err instanceof ApiError) {
                pushToast({ message: err.message });
            } else {
                pushToast({ message: '저장 중 오류가 발생했어요. 다시 시도해 주세요.' });
            }
        }
    };

    return (
        <ProgramEditScaffold
            title="운영 정보 수정"
            isDirty={isDirty}
            isSaving={isSaving}
            onSave={handleSave}
        >
            <ProgramOperationsEditForm form={form} errors={errors} onChange={patch} />
        </ProgramEditScaffold>
    );
}
