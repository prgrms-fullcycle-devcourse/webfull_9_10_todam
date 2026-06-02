'use client';

import { Button } from '@todam/ui';

// 하단 fixed Save Button Section.
// Figma 정본:
//   container 360 wide, padding (16 16 28 16) — bottom 28 safe area
//   background #FFFFFF (= surface), border-top #E2E4E7 1px (= border-subtle)
//   button 328×56 radius 16, SemiBold 16/20
//     disabled: bg #F1F2F4 (muted), text #C8CBD1 (foreground-disabled)
//     active:   bg #1D5628 (primary), text #FFFFFF (foreground-inverse)
//
// 본 컴포넌트는 sticky bottom 으로 main 영역 하단에 고정. layout 의 BottomNav 가 (sub) 그룹에서
// 없는 화면이라(예약 상세 자체가 sub 라우트) overlap 위험 적음.
export type SaveButtonSectionProps = {
    disabled?: boolean;
    loading?: boolean;
    onClick: () => void;
};

export function SaveButtonSection({ disabled, loading, onClick }: SaveButtonSectionProps) {
    return (
        <div className="sticky bottom-0 left-0 right-0 -mx-4 border-t border-border-subtle bg-surface px-4 pb-7 pt-4">
            <Button
                type="button"
                variant="filled"
                size="lg"
                onClick={onClick}
                disabled={disabled || loading}
                className="w-full"
            >
                {loading ? '저장 중…' : '저장'}
            </Button>
        </div>
    );
}
