'use client';

import { BottomBar, Button, Modal } from '@todam/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { PartnerStatus, StoreRegistrationApiErrorCode } from '@todam/shared';

import { ApiError } from '@/shared/api';
import { useModal, useToast } from '@/shared/model';
import { ProgressBarWrapper } from '@/shared/ui';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { isAllValid, isDirty, isStepValid, useStudioRegistrationStore } from '../model/studio';
import {
    usePartnerOnboarding,
    useSubmitStudioRegistration,
    useVerifyBusinessDocument,
} from '../queries';
import { StoreRegistrationStep, STEP_TITLES, TOTAL_STEPS } from '../model/types';

import { BusinessStep } from './BusinessStep';
import { StudioRegistrationComplete } from './StudioRegistrationComplete';
import { OperatingStep } from './OperatingStep';
import { ReservationStep } from './ReservationStep';
import { StudioInfoStep } from './StudioInfoStep';

export type StudioRegistrationFlowProps = {
    // 닫기/첫 단계 뒤로가기 시 돌아갈 경로. 진입점별로 다르다. (예: /apply→/my, /partner/studio/new→/partner)
    returnTo?: string;
};

export function StudioRegistrationFlow({ returnTo = '/my' }: StudioRegistrationFlowProps) {
    const router = useRouter();
    const step = useStudioRegistrationStore((s) => s.step);
    const form = useStudioRegistrationStore((s) => s.form);
    const next = useStudioRegistrationStore((s) => s.next);
    const prev = useStudioRegistrationStore((s) => s.prev);
    const setStep = useStudioRegistrationStore((s) => s.setStep);
    const patchStudio = useStudioRegistrationStore((s) => s.patchStudio);
    const reset = useStudioRegistrationStore((s) => s.reset);
    const { push } = useToast();
    const { open: openModal, close: closeModal } = useModal();

    const submitMutation = useSubmitStudioRegistration();
    const submitting = submitMutation.isPending;
    const verifyMutation = useVerifyBusinessDocument();
    const verifying = verifyMutation.isPending;
    // 공방 등록 완료 후 승인된 파트너 여부에 따라 '홈으로' 목적지 분기
    const { data: onboarding } = usePartnerOnboarding(true);
    const isApprovedPartner = onboarding?.partnerStatus === PartnerStatus.APPROVED;
    const [submittedStoreId, setSubmittedStoreId] = useState<string | null>(null);
    const submitted = submittedStoreId !== null;

    const dirty = isDirty(form);

    // 스텝 전환 시 스크롤 컨테이너를 최상단으로 (긴 폼에서 이전 스크롤 위치 잔존 방지)
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [step]);

    // 진입점 2개(/apply, /partner/studio/new)가 전역 store 공유 → 플로우 이탈 시 초기화
    useEffect(() => () => reset(), [reset]);

    const exit = () => {
        reset();
        router.push(returnTo);
    };

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

    useHeaderOverride({
        title: '공방 등록하기',
        onBack: handleBack,
        onClose: guardedExit,
        guardDirty: dirty,
        enabled: !submitted,
    });

    if (submittedStoreId) {
        return (
            <StudioRegistrationComplete
                storeId={submittedStoreId}
                onClose={() => {
                    reset();
                    router.push(isApprovedPartner ? '/partner' : '/');
                }}
                onEditInfo={() => {
                    reset();
                    router.push(`/partner/studio/${submittedStoreId}/business`);
                }}
            />
        );
    }

    const isLast = step === StoreRegistrationStep.Reservation;
    const stepValid = isStepValid(form, step);
    const progress = ((step + 1) / TOTAL_STEPS) * 100;

    // Business step "다음" = 국세청 진위확인 게이트. 통과(VERIFIED)만 next(). 그 외 message별 토스트 + 차단.
    // (stepValid 와 별개: 폼이 valid 해도 verify 통과 전엔 next() 금지.)
    const VERIFY_MESSAGE: Record<string, string> = {
        MISMATCH: '정확한 사업자 정보를 입력해 주세요.',
        BUSINESS_CLOSED: '폐업한 사업장은 등록할 수 없어요.',
        BUSINESS_SUSPENDED: '휴업 중인 사업장입니다. 고객센터로 문의해주세요.',
        NTS_ERROR: '진위확인에 실패했어요. 잠시 후 다시 시도해주세요.',
    };

    const handleBusinessNext = async () => {
        if (verifying) return;
        try {
            const { message } = await verifyMutation.mutateAsync({
                businessNumber: form.business.businessNumber.replace(/-/g, ''),
                ownerName: form.business.ownerName,
                startDate: form.business.startDate,
            });
            if (message === 'VERIFIED') {
                next();
                return;
            }
            push({ message: VERIFY_MESSAGE[message] ?? '진위확인에 실패했어요.' });
        } catch (err) {
            // 엔드포인트 자체 실패(400/401 등). MISMATCH 문구와 혼용 금지 → 일반 오류 안내.
            push({
                message:
                    err instanceof ApiError
                        ? err.message
                        : '진위확인 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
            });
        }
    };

    const handleNext = () => {
        if (step === StoreRegistrationStep.Business) void handleBusinessNext();
        else next();
    };

    const handleSubmit = async () => {
        if (!isAllValid(form) || submitting) return;
        try {
            const { storeId } = await submitMutation.mutateAsync(form);
            setSubmittedStoreId(storeId);
        } catch (err) {
            if (err instanceof ApiError) {
                push({ message: err.message });
                if (err.code === StoreRegistrationApiErrorCode.SLUG_CONFLICT) {
                    patchStudio({ slugChecked: true, slugAvailable: false });
                    setStep(StoreRegistrationStep.StoreInfo);
                } else if (err.code === StoreRegistrationApiErrorCode.PARTNER_NOT_APPROVED) {
                    // 승인되지 않은 파트너의 추가 공방 등록 차단 → 메시지만 노출.
                    setStep(StoreRegistrationStep.Business);
                } else if (err.code === StoreRegistrationApiErrorCode.BAD_REQUEST) {
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
            <div ref={scrollRef} className="flex flex-1 flex-col overflow-y-auto px-4 pb-16">
                <div className="py-2">
                    <ProgressBarWrapper value={progress} leftLabel={`${step + 1}/4 단계`} />
                </div>

                <div className="flex flex-col gap-4 py-2">
                    <h2 className="py-2 text-lg font-semibold text-foreground">
                        {STEP_TITLES[step]}
                    </h2>
                    {step === StoreRegistrationStep.Business && <BusinessStep />}
                    {step === StoreRegistrationStep.StoreInfo && <StudioInfoStep />}
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
                    <Button
                        className="w-full"
                        disabled={!stepValid || verifying}
                        onClick={handleNext}
                    >
                        {verifying ? '진위확인 중...' : '다음'}
                    </Button>
                )}
            </BottomBar>
        </div>
    );
}
