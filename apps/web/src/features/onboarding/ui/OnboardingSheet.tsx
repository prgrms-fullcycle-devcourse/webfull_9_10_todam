'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useSheet, useToast } from '@/shared/model';

import { OnboardingSheetShell } from './OnboardingSheetShell';

// 메인 온보딩 바텀시트. AppSheet(host)에 content로 주입되고, 셸은 온보딩 전용 OnboardingSheetShell 사용
// (공통 컴포넌트 StandardBottomSheet 수정 금지 → 피처 내부 셸로 disabled CTA 지원).
// 이용 유형(공방 예약 / 공방 등록) 카드를 "선택"한 뒤 하단 "시작하기"로 확정하는 2단계 모델(디자인 준수).
// 건너뛰기 시 안내 토스트 노출. 분기/네비게이션만 담당한다.
//
// ⚠️ 온보딩 완료 저장 API는 미확정(plan Open decision #1). 존재하지 않는 저장 API를
// 호출하지 않는다. 향후 부모가 onSelectReserve/onSelectRegister/onSkip 콜백에서
// 저장 API를 붙이도록 콜백 주입형으로 설계한다.

type OnboardingType = 'reserve' | 'register';

type OnboardingOption = {
    type: OnboardingType;
    title: string;
    description: string;
};

const ONBOARDING_OPTIONS: OnboardingOption[] = [
    {
        type: 'reserve',
        title: '공방 예약하기',
        description: '가까운 공방을 찾고 나만의 작품을 만들어요.',
    },
    {
        type: 'register',
        title: '공방 등록하기',
        description: '공방을 등록하고 나도 입점해 수강생과 함께해요.',
    },
];

const SKIP_TOAST_MESSAGE = '공방 등록은 마이페이지에서 언제든 가능해요.';

export type OnboardingSheetProps = {
    // 공방 예약하기 선택 후 시작하기 시. 미주입이면 시트 닫기만 한다.
    onSelectReserve?: () => void;
    // 공방 등록하기 선택 후 시작하기 시. 미주입이면 시트 닫고 /partner/stores/new 로 이동한다.
    onSelectRegister?: () => void;
    // 건너뛰기 선택 시. 미주입이면 시트 닫고 안내 토스트만 띄운다.
    onSkip?: () => void;
};

export function OnboardingSheet({
    onSelectReserve,
    onSelectRegister,
    onSkip,
}: OnboardingSheetProps) {
    const router = useRouter();
    const { close } = useSheet();
    const { push } = useToast();
    const [selected, setSelected] = useState<OnboardingType | null>(null);

    const handleStart = () => {
        if (!selected) return;
        // TODO(온보딩-저장-API): Open decision #1 확정 후 부모 콜백에서 온보딩 완료 저장 연동.
        close();
        if (selected === 'reserve') {
            onSelectReserve?.();
            return;
        }
        if (onSelectRegister) {
            onSelectRegister();
            return;
        }
        router.push('/partner/stores/new');
    };

    const handleSkip = () => {
        // TODO(온보딩-저장-API): Open decision #1 확정 후 부모 콜백에서 온보딩 완료(partner 권한 미부여) 저장 연동.
        close();
        push({ message: SKIP_TOAST_MESSAGE });
        onSkip?.();
    };

    return (
        <OnboardingSheetShell
            title="토담에 오신 것을 환영합니다!"
            subTitle="어떤 서비스부터 시작할까요?"
            actionLabel="시작하기"
            actionDisabled={!selected}
            onAction={handleStart}
            subLabel="건너뛰기"
            onSub={handleSkip}
        >
            <div className="grid grid-cols-2 gap-2">
                {ONBOARDING_OPTIONS.map((option) => {
                    const isSelected = selected === option.type;
                    return (
                        <button
                            key={option.type}
                            type="button"
                            aria-pressed={isSelected}
                            className={`flex cursor-pointer flex-col gap-5 rounded-2xl border p-4 text-left transition-colors ${
                                isSelected
                                    ? 'border-primary bg-surface'
                                    : 'border-border-subtle bg-surface hover:bg-muted'
                            }`}
                            onClick={() => setSelected(option.type)}
                        >
                            <span className="text-base font-medium leading-5 text-foreground">
                                {option.title}
                            </span>
                            <span className="text-xs font-normal leading-4 text-foreground-tertiary">
                                {option.description}
                            </span>
                        </button>
                    );
                })}
            </div>
        </OnboardingSheetShell>
    );
}
