'use client';

import { BottomBar, Button, Modal } from '@todam/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ProgramDeliveryOption } from '@todam/shared';

import { ApiError } from '../../../../../../shared/api';
import { useModal } from '../../../../../../shared/model/modal';
import { useToast } from '../../../../../../shared/model/toast';
import { usePatchProgram, useProgramDetail } from '../../../../../../features/program/edit/queries';
import type { ProgramOperationsFormState } from '../../../../../../features/program/edit/model/types';
import { useLeaveGuard } from '../../../../../../features/program/edit/model/useLeaveGuard';
import { ProgramOperationsEditForm } from '../../../../../../features/program/edit/ui/ProgramOperationsEditForm';

// preload용 mock slug. 실 연동 시 세션 또는 URL 파라미터로 교체.
const MOCK_SLUG = 'todam-pottery';

type PageProps = { params: Promise<{ id: string }> };

export default function PartnerClassEditOperationsPage({ params }: PageProps) {
    const router = useRouter();
    const { push: pushToast } = useToast();
    const { open: openModal, close: closeModal } = useModal();

    const [programId, setProgramId] = useState<string>('');
    useEffect(() => {
        params.then((p) => setProgramId(p.id));
    }, [params]);

    // ─── preload ────────────────────────────────────────────────
    const { data: detailData, isLoading } = useProgramDetail(MOCK_SLUG, programId);
    const program = detailData?.program;
    const storeId = program?.storeId ?? '';

    // ─── 폼 상태 ────────────────────────────────────────────────
    const [form, setForm] = useState<ProgramOperationsFormState>({
        price: 0,
        capacity: 1,
        leadTimeDays: 0,
        durationMinutes: 120,
        deliveryOption: ProgramDeliveryOption.PICKUP,
        childrenAllowed: false,
        deliveryAvailable: false,
    });

    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        if (program && !initialized) {
            // 서버 preload 데이터로 폼 1회 hydration (의도된 동기화)
            setForm({
                price: program.price,
                capacity: program.capacity,
                leadTimeDays: program.leadTimeDays,
                durationMinutes: program.durationMinutes,
                deliveryOption: program.deliveryOption,
                childrenAllowed: program.childrenAllowed ?? false,
                deliveryAvailable: program.deliveryAvailable ?? false,
            });
            setInitialized(true);
        }
    }, [program, initialized]);

    // ─── dirty 판정 ─────────────────────────────────────────────
    const isDirty =
        initialized &&
        program != null &&
        (form.price !== program.price ||
            form.capacity !== program.capacity ||
            form.leadTimeDays !== program.leadTimeDays ||
            form.durationMinutes !== program.durationMinutes ||
            form.deliveryOption !== program.deliveryOption ||
            form.childrenAllowed !== (program.childrenAllowed ?? false) ||
            form.deliveryAvailable !== (program.deliveryAvailable ?? false));

    useLeaveGuard(isDirty);

    // ─── 유효성 검사 ─────────────────────────────────────────────
    const [errors, setErrors] = useState<Partial<Record<keyof ProgramOperationsFormState, string>>>(
        {},
    );

    function validate(): boolean {
        const errs: Partial<Record<keyof ProgramOperationsFormState, string>> = {};
        if (!form.price || form.price <= 0) errs.price = '가격을 입력해 주세요.';
        if (form.capacity < 1) errs.capacity = '정원은 1명 이상이어야 합니다.';
        if (!form.durationMinutes) errs.durationMinutes = '소요시간을 선택해 주세요.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    // ─── mutation ───────────────────────────────────────────────
    const patchMutation = usePatchProgram(storeId, programId);
    const isSaving = patchMutation.isPending;

    // ─── 이탈 가드 ──────────────────────────────────────────────
    const handleBack = () => {
        if (!isDirty) {
            router.push(`/partner/classes/${programId}`);
            return;
        }
        openModal(
            <Modal
                title="변경사항을 저장하지 않고 나가시겠어요?"
                description="저장하지 않은 내용은 사라집니다."
                confirmLabel="나가기"
                cancelLabel="계속 수정"
                danger
                onConfirm={() => {
                    closeModal();
                    router.push(`/partner/classes/${programId}`);
                }}
                onCancel={closeModal}
                onBackdropClick={closeModal}
            />,
        );
    };

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
            router.push(`/partner/classes/${programId}`);
        } catch (err) {
            if (err instanceof ApiError) {
                pushToast({ message: err.message });
            } else {
                pushToast({ message: '저장 중 오류가 발생했어요. 다시 시도해 주세요.' });
            }
        }
    };

    if (isLoading || !initialized) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <span className="text-sm text-foreground-tertiary">불러오는 중...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* 헤더 */}
            <header className="flex h-15 shrink-0 items-center bg-transparent pt-safe">
                <button
                    type="button"
                    aria-label="뒤로가기"
                    onClick={handleBack}
                    className="flex h-14 w-14 items-center justify-center text-foreground"
                >
                    ←
                </button>
                <span className="flex-1 truncate text-lg font-medium leading-6 text-foreground">
                    운영 정보 수정
                </span>
            </header>

            {/* 폼 영역 */}
            <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-4">
                <ProgramOperationsEditForm
                    form={form}
                    errors={errors}
                    onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                />
            </div>

            {/* 저장 버튼 */}
            <BottomBar>
                <Button className="w-full" disabled={!isDirty || isSaving} onClick={handleSave}>
                    {isSaving ? '저장 중...' : '저장하기'}
                </Button>
            </BottomBar>
        </div>
    );
}
