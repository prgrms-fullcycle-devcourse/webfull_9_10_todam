'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { ProgramDetail } from '@todam/shared';

import { ApiError } from '../../../../shared/api';
import { useToast } from '../../../../shared/model/toast';
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

    // 서버 데이터로 폼 초기값 1회 구성 (lazy initializer — setState-in-effect 회피)
    const [form, setForm] = useState<ProgramOperationsFormState>(() => ({
        price: program.price,
        capacity: program.capacity,
        leadTimeDays: program.leadTimeDays,
        durationMinutes: program.durationMinutes,
        deliveryOption: program.deliveryOption,
        childrenAllowed: program.childrenAllowed ?? false,
        deliveryAvailable: program.deliveryAvailable ?? false,
    }));

    // ─── dirty 판정 ─────────────────────────────────────────────
    const isDirty =
        form.price !== program.price ||
        form.capacity !== program.capacity ||
        form.leadTimeDays !== program.leadTimeDays ||
        form.durationMinutes !== program.durationMinutes ||
        form.deliveryOption !== program.deliveryOption ||
        form.childrenAllowed !== (program.childrenAllowed ?? false) ||
        form.deliveryAvailable !== (program.deliveryAvailable ?? false);

    // ─── 유효성 검사 ─────────────────────────────────────────────
    const [errors, setErrors] = useState<Partial<Record<keyof ProgramOperationsFormState, string>>>(
        {},
    );

    function validate(): boolean {
        const errs: Partial<Record<keyof ProgramOperationsFormState, string>> = {};
        const priceError = validatePrice(form.price);
        if (priceError) errs.price = priceError;
        const capacityError = validateCapacity(form.capacity);
        if (capacityError) errs.capacity = capacityError;
        const durationError = validateDurationMinutes(form.durationMinutes);
        if (durationError) errs.durationMinutes = durationError;
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    // ─── mutation ───────────────────────────────────────────────
    const patchMutation = usePatchProgram(program.storeId, programId);
    const isSaving = patchMutation.isPending;

    // ─── 저장 ────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate() || isSaving) return;

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
            <ProgramOperationsEditForm
                form={form}
                errors={errors}
                onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
            />
        </ProgramEditScaffold>
    );
}
