'use client';

import { BottomBar, Button, CloseIcon, LeftIcon } from '@todam/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useToast } from '../../../../shared/model';
import { ProgressBarWrapper } from '../../../../shared/ui';
import { isStepValid, useProgramRegistrationStore } from '../model/store';
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

    // 플로우 이탈 시 전역 store 초기화
    useEffect(() => () => reset(), [reset]);

    const exit = () => {
        reset();
        router.push(returnTo);
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
        if (step === ProgramRegistrationStep.BasicInfo) exit();
        else prev();
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header (back + title + close) */}
            <header className="flex h-15 shrink-0 items-center bg-transparent pt-safe">
                <Button
                    variant="ghost"
                    layout="onlyIcon"
                    size="lg"
                    icon={<LeftIcon />}
                    aria-label="뒤로가기"
                    onClick={handleBack}
                    className="hover:!bg-transparent hover:!text-foreground"
                />
                <span className="flex-1 truncate text-lg font-medium leading-6 text-foreground">
                    클래스 등록
                </span>
                <Button
                    variant="ghost"
                    layout="onlyIcon"
                    size="lg"
                    icon={<CloseIcon />}
                    aria-label="닫기"
                    onClick={exit}
                    className="hover:!bg-transparent hover:!text-foreground"
                />
            </header>

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
