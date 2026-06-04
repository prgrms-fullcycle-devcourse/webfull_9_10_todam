import type { ReactNode } from 'react';

import { Button, type ButtonVariant } from '@todam/ui';

// 온보딩 전용 시트 셸.
// 공통 컴포넌트(@todam/ui StandardBottomSheet)는 수정 금지라, 셸 마크업을 피처 내부에 자체 구현한다.
// 차이점: primary CTA 에 actionDisabled(미선택 시 비활성)를 지원한다. Button 은 @todam/ui 것을 사용.
// 셸 컨테이너 스타일은 StandardBottomSheet 와 동일 토큰을 따른다(디자인 일관성).

type OnboardingSheetShellProps = {
    title?: string;
    subTitle?: string;
    children?: ReactNode;
    actionLabel?: string;
    actionVariant?: ButtonVariant;
    actionDisabled?: boolean;
    onAction?: () => void;
    subLabel?: string;
    onSub?: () => void;
};

export function OnboardingSheetShell({
    title,
    subTitle,
    children,
    actionLabel = '확인',
    actionVariant = 'filled',
    actionDisabled = false,
    onAction,
    subLabel,
    onSub,
}: OnboardingSheetShellProps) {
    // dim 배경 + slide/drag 애니메이션은 시트 렌더러(AppSheet)가 담당. 패널만 렌더.
    return (
        <div className="mx-2 mb-10 flex flex-col items-center gap-8 rounded-3xl bg-surface p-4 shadow-[0_0_10px_rgba(0,0,0,0.10)]">
            <div className="h-4 w-9 cursor-pointer pt-[5px]">
                <div className="h-1 w-9 rounded-full bg-border" />
            </div>

            <div className="flex w-full flex-col gap-7">
                {(title || subTitle) && (
                    <div className="flex flex-col gap-1">
                        {title && (
                            <p className="text-2xl font-bold leading-8 text-foreground">{title}</p>
                        )}
                        {subTitle && (
                            <p className="text-lg font-normal leading-6 text-foreground-secondary">
                                {subTitle}
                            </p>
                        )}
                    </div>
                )}

                {children && <div className="w-full">{children}</div>}

                <div className="flex w-full flex-col">
                    <Button
                        variant={actionVariant}
                        size="lg"
                        className="w-full"
                        disabled={actionDisabled}
                        onClick={onAction}
                    >
                        {actionLabel}
                    </Button>
                    {subLabel && (
                        <Button
                            variant="ghost"
                            size="lg"
                            className="w-full hover:!bg-transparent hover:!text-foreground"
                            onClick={onSub}
                        >
                            {subLabel}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
