'use client';

import { BottomBar, Button, Modal } from '@todam/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useModal, useToast } from '@/shared/model';
import { ProgressBarWrapper } from '@/shared/ui';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { isDirty, isStepValid, useProgramRegistrationStore } from '../model/store';
import { ProgramRegistrationStep, STEP_TITLES, TOTAL_STEPS } from '../model/types';

import { BasicInfoStep } from './BasicInfoStep';
import { OperatingStep } from './OperatingStep';

export type ProgramRegistrationFlowProps = {
    // 닫기/첫 단계 뒤로가기 시 복귀 경로 (기본: 클래스 관리 목록)
    returnTo?: string;
};

export function ProgramRegistrationFlow({
    returnTo = '/partner/classes',
}: ProgramRegistrationFlowProps) {
    const router = useRouter();
    const step = useProgramRegistrationStore((s) => s.step);
    const form = useProgramRegistrationStore((s) => s.form);
    const next = useProgramRegistrationStore((s) => s.next);
    const prev = useProgramRegistrationStore((s) => s.prev);
    const reset = useProgramRegistrationStore((s) => s.reset);
    const { push } = useToast();
    const { open: openModal, close: closeModal } = useModal();

    const dirty = isDirty(form);

    // 플로우 이탈 시 전역 store 초기화
    useEffect(() => () => reset(), [reset]);

    const exit = () => {
        reset();
        router.push(returnTo);
    };

    // 작성 중이면 확인 모달, 아니면 즉시 이탈.
    const guardedExit = () => {
        if (!dirty) {
            exit();
            return;
        }
        openModal(
            <Modal
                title="작성을 취소하고 나가시겠어요?"
                description="작성한 내용은 저장되지 않아요."
                confirmLabel="나가기"
                cancelLabel="계속 작성"
                danger
                onConfirm={() => {
                    closeModal();
                    exit();
                }}
                onCancel={closeModal}
            />,
        );
    };

    // TODO(연동 후행): POST /partner/stores/{storeId}/programs 호출 (ACTIVE 직접 생성).
    // 현재 BE 미구현 → 등록 성공 처리만(토스트 + 목록 복귀).
    const handleSubmit = () => {
        if (!stepValid) return;
        reset();
        router.push(returnTo);
        push({ message: '새로운 클래스가 등록되었어요' });
    };

    const isLast = step === ProgramRegistrationStep.Operating;
    const stepValid = isStepValid(form, step);
    const progress = ((step + 1) / TOTAL_STEPS) * 100;

    const handleBack = () => {
        if (step === ProgramRegistrationStep.BasicInfo) guardedExit();
        else prev();
    };

    // 전역 Header override: 뒤로가기(첫 단계는 이탈 가드) + 닫기(X, 이탈 가드).
    useHeaderOverride({
        title: '클래스 등록',
        onBack: handleBack,
        onClose: guardedExit,
        guardDirty: dirty,
    });

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Container */}
            <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-16">
                <div className="py-2">
                    <ProgressBarWrapper
                        value={progress}
                        leftLabel={`${step + 1}/${TOTAL_STEPS} 단계`}
                    />
                </div>

                <div className="flex flex-col gap-4 py-2">
                    <h2 className="py-2 text-lg font-semibold text-foreground">
                        {STEP_TITLES[step]}
                    </h2>
                    {step === ProgramRegistrationStep.BasicInfo && <BasicInfoStep />}
                    {step === ProgramRegistrationStep.Operating && <OperatingStep />}
                </div>
            </div>

            {/* 하단 액션 */}
            <BottomBar>
                <Button
                    className="w-full"
                    disabled={!stepValid}
                    onClick={isLast ? handleSubmit : next}
                >
                    {isLast ? '저장' : '다음'}
                </Button>
            </BottomBar>
        </div>
    );
}
