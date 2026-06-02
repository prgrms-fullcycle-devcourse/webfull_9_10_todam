'use client';

import { useRouter } from 'next/navigation';

import type { ProgramDetail } from '@todam/shared';

import { ApiError } from '../../../../shared/api';
import { useToast } from '../../../../shared/model/toast';
import { useEditableForm } from '../../../../shared/lib/useEditableForm';
import { useFormValidation } from '../../../../shared/lib/useFormValidation';
import {
    validateCapacity,
    validateDurationMinutes,
    validatePrice,
} from '../../../../entities/program';
import { usePatchProgram } from '../queries';
import type { ProgramOperationsFormState } from '../model/types';
import { ProgramEditScaffold } from './ProgramEditScaffold';
import { ProgramOperationsEditForm } from './ProgramOperationsEditForm';

type Props = {
    programId: string;
    program: ProgramDetail;
};

export function ProgramOperationsEditScreen({ programId, program }: Props) {
    const router = useRouter();
    const { push: pushToast } = useToast();
    const backTo = `/partner/classes/${programId}`;

    // 서버 데이터 baseline → 폼 1회 초기화 + dirty 파생
    const baseline: ProgramOperationsFormState = {
        price: program.price,
        capacity: program.capacity,
        leadTimeDays: program.leadTimeDays,
        durationMinutes: program.durationMinutes,
        deliveryOption: program.deliveryOption,
        childrenAllowed: program.childrenAllowed ?? false,
        deliveryAvailable: program.deliveryAvailable ?? false,
    };
    const { form, patch, isDirty } = useEditableForm(baseline);

    // ─── 유효성 검사 ─────────────────────────────────────────────
    const { errors, validate } = useFormValidation<ProgramOperationsFormState>({
        price: validatePrice,
        capacity: validateCapacity,
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
                capacity: form.capacity,
                leadTimeDays: form.leadTimeDays,
                durationMinutes: form.durationMinutes,
                deliveryOption: form.deliveryOption,
                childrenAllowed: form.childrenAllowed,
                deliveryAvailable: form.deliveryAvailable,
            });

            pushToast({ message: '수정된 클래스 정보가 반영되었어요.' });
            router.push(backTo);
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
            backTo={backTo}
        >
            <ProgramOperationsEditForm form={form} errors={errors} onChange={patch} />
        </ProgramEditScaffold>
    );
}
