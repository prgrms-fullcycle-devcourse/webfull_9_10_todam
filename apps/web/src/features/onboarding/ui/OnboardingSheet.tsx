'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { RadioInput, StandardBottomSheet } from '@todam/ui';

import { useSheet, useToast } from '@/shared/model';

// 메인 온보딩 바텀시트. AppSheet(host)에 content로 주입. 공통 StandardBottomSheet 사용.
// 이용 유형(공방 예약 / 공방 등록)을 라디오로 선택(기본 선택 1개라 CTA 항상 활성) 후 "시작하기"로 확정.
// 건너뛰기 시 안내 토스트 노출. 분기/네비게이션만 담당한다.
//
// 온보딩 완료 여부는 서버에 저장하지 않는다(결정 2026-06-05). 회원가입 성공 시(signup 페이지)
// AppSheet에 직접 open해 1회만 노출 — 영구 플래그/API 불필요.

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

export type OnboardingSheetProps = {
    // 공방 예약하기 선택 후 시작하기 시. 미주입이면 시트 닫기만 한다.
    onSelectReserve?: () => void;
    // 공방 등록하기 선택 후 시작하기 시. 미주입이면 시트 닫고 /partner/studio/new 로 이동한다.
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
    const [selected, setSelected] = useState<OnboardingType>('reserve');

    const handleStart = () => {
        close();
        if (selected === 'reserve') {
            onSelectReserve?.();
            return;
        }
        if (onSelectRegister) {
            onSelectRegister();
            return;
        }
        router.push('/partner/studio/new');
    };

    const handleSkip = () => {
        close();
        push({ message: '공방 등록은 마이페이지에서 언제든 가능해요.' });
        onSkip?.();
    };

    return (
        <StandardBottomSheet
            title="토담에 오신 것을 환영합니다!"
            subTitle="어떤 서비스부터 시작할까요?"
            actionLabel="시작하기"
            onAction={handleStart}
            subLabel="건너뛰기"
            onSub={handleSkip}
        >
            <div className="flex flex-col gap-2">
                {ONBOARDING_OPTIONS.map((option) => (
                    <RadioInput
                        key={option.type}
                        title={option.title}
                        description={option.description}
                        selected={selected === option.type}
                        onSelect={() => setSelected(option.type)}
                    />
                ))}
            </div>
        </StandardBottomSheet>
    );
}
