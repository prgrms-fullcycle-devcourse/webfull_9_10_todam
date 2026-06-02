'use client';

import { BottomBar, Button, Modal } from '@todam/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { StoreRegistrationErrorCode } from '@todam/shared';

import { ApiError } from '@/shared/api';
import { useModal, useToast } from '@/shared/model';
import { ProgressBarWrapper } from '@/shared/ui';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { isAllValid, isDirty, isStepValid, useStoreRegistrationStore } from '../model/store';
import { useSubmitStoreRegistration } from '../queries';
import { StoreRegistrationStep, STEP_TITLES, TOTAL_STEPS } from '../model/types';

import { BusinessStep } from './BusinessStep';
import { StoreRegistrationComplete } from './StoreRegistrationComplete';
import { OperatingStep } from './OperatingStep';
import { ReservationStep } from './ReservationStep';
import { StoreInfoStep } from './StoreInfoStep';

export type StoreRegistrationFlowProps = {
    // 닫기/첫 단계 뒤로가기 시 돌아갈 경로. 진입점별로 다르다. (예: /apply→/my, /partner/stores/new→/partner/stores)
    returnTo?: string;
};

export function StoreRegistrationFlow({ returnTo = '/my' }: StoreRegistrationFlowProps) {
    const router = useRouter();
    const step = useStoreRegistrationStore((s) => s.step);
    const form = useStoreRegistrationStore((s) => s.form);
    const next = useStoreRegistrationStore((s) => s.next);
    const prev = useStoreRegistrationStore((s) => s.prev);
    const setStep = useStoreRegistrationStore((s) => s.setStep);
    const patchStore = useStoreRegistrationStore((s) => s.patchStore);
    const reset = useStoreRegistrationStore((s) => s.reset);
    const { push } = useToast();
    const { open: openModal, close: closeModal } = useModal();

    const submitMutation = useSubmitStoreRegistration();
    const submitting = submitMutation.isPending;
    const [submitted, setSubmitted] = useState(false);

    const dirty = isDirty(form);

    // 진입점 2개(/apply, /partner/stores/new)가 전역 store 공유 → 플로우 이탈 시 초기화
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

    const handleBack = () => {
        if (step === StoreRegistrationStep.Business) guardedExit();
        else prev();
    };

    // 전역 Header override: 뒤로가기(첫 단계는 이탈 가드) + 닫기(X). 완료 화면(submitted)은 헤더 없음.
    useHeaderOverride({
        title: '공방 등록하기',
        onBack: handleBack,
        onClose: guardedExit,
        guardDirty: dirty,
        enabled: !submitted,
    });

    if (submitted) {
        return (
            <StoreRegistrationComplete
                onClose={() => {
                    reset();
                    router.push('/');
                }}
                onEditInfo={() => {
                    // 반려 → 정보 수정: 폼 유지한 채 1단계로 복귀 (링크 연동 추후)
                    setSubmitted(false);
                    setStep(StoreRegistrationStep.Business);
                }}
            />
        );
    }

    const isLast = step === StoreRegistrationStep.Reservation;
    const stepValid = isStepValid(form, step);
    const progress = ((step + 1) / TOTAL_STEPS) * 100;

    const handleSubmit = async () => {
        if (!isAllValid(form) || submitting) return;
        try {
            await submitMutation.mutateAsync(form);
            setSubmitted(true);
        } catch (err) {
            if (err instanceof ApiError) {
                push({ message: err.message });
                if (err.code === StoreRegistrationErrorCode.STORE_SLUG_DUPLICATED) {
                    patchStore({ slugChecked: true, slugAvailable: false });
                    setStep(StoreRegistrationStep.StoreInfo);
                } else if (
                    err.code === StoreRegistrationErrorCode.BUSINESS_NUMBER_ALREADY_REGISTERED
                ) {
                    setStep(StoreRegistrationStep.Business);
                }
            } else {
                push({ message: '신청 중 오류가 발생했습니다.' });
            }
        }
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Container */}
            <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-16">
                <div className="py-2">
                    <ProgressBarWrapper value={progress} leftLabel={`${step + 1}/4 단계`} />
                </div>

                <div className="flex flex-col gap-4 py-2">
                    <h2 className="py-2 text-lg font-semibold text-foreground">
                        {STEP_TITLES[step]}
                    </h2>
                    {step === StoreRegistrationStep.Business && <BusinessStep />}
                    {step === StoreRegistrationStep.StoreInfo && <StoreInfoStep />}
                    {step === StoreRegistrationStep.Operating && <OperatingStep />}
                    {step === StoreRegistrationStep.Reservation && <ReservationStep />}
                </div>
            </div>

            {/* 하단 액션 */}
            <BottomBar>
                {isLast ? (
                    <Button
                        className="w-full"
                        disabled={!isAllValid(form) || submitting}
                        onClick={handleSubmit}
                    >
                        {submitting ? '신청 중...' : '신청하기'}
                    </Button>
                ) : (
                    <Button className="w-full" disabled={!stepValid} onClick={next}>
                        다음
                    </Button>
                )}
            </BottomBar>
        </div>
    );
}
