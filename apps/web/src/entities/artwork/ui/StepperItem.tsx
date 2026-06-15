'use client';

import type { ComponentType } from 'react';
import {
    SunIcon,
    FireIcon,
    WaterIcon,
    FireDoubleIcon,
    FlagIcon,
    LeafIcon,
} from '@todam/ui';
import {
    ArtworkStatus,
    formatYmdShort,
    type ArtworkPhoto,
    type ArtworkTimelineEntry,
} from '@todam/shared';

import { StepperIcon } from '@/shared/ui';

import { StepperItemMedia } from './StepperItemMedia';

// 타임라인 단일 항목 (Figma `8505:15922` / `8505:16209` / QA `8716:16510`).
// variant 결정 로직:
//   - isCompleted=true → completed
//   - isCurrent=true → current
//   - 그 외 → upcoming
// isLast 일 때 connector 미노출.
//
// 단계 아이콘(상태 단계별 아이콘): 파트너 PartnerArtworkStepper 와 동일하게
//   shared StepperIcon 원 "안"에 단계 아이콘을 넣는다(파트너/유저 화면 일치).
//   - completed → 체크(StepperIcon 내부 처리), current/upcoming → 단계 아이콘.
//
// Design tokens (StepperIcon SSOT):
// - 좌측 28×28 icon 컬럼 + 우측 child(width 288), gap 12
// - completed: bg success(green) + 흰 체크
// - current: bg info-subtle + 단계 아이콘
// - upcoming: bg surface + border + 단계 아이콘(foreground-tertiary)
// - connector: completed→success-lighter, 그 외 muted(#F1F2F4, Figma connector fill)

type Variant = 'completed' | 'current' | 'upcoming';

type SizeProps = { size?: number };

// stage(ArtworkStatus) → 단계 아이콘. 파트너 STEP_ICON_MAP 과 동일 아이콘 매핑.
// 매핑 외 단계는 LeafIcon 으로 폴백(파트너 동작과 일치).
const STEP_ICON_MAP: Partial<Record<ArtworkStatus, ComponentType<SizeProps>>> = {
    [ArtworkStatus.RESERVED]: LeafIcon,
    [ArtworkStatus.VISITED]: LeafIcon,
    [ArtworkStatus.DRYING]: SunIcon,
    [ArtworkStatus.BISQUE_FIRING]: FireIcon,
    [ArtworkStatus.GLAZING]: WaterIcon,
    [ArtworkStatus.GLAZE_FIRING]: FireDoubleIcon,
    [ArtworkStatus.COMPLETED]: FlagIcon,
};

function pickVariant(entry: ArtworkTimelineEntry): Variant {
    if (entry.isCompleted) return 'completed';
    if (entry.isCurrent) return 'current';
    return 'upcoming';
}

export type StepperItemProps = {
    entry: ArtworkTimelineEntry;
    isLast: boolean;
    onSelectPhoto: (photo: ArtworkPhoto) => void;
};

export function StepperItem({ entry, isLast, onSelectPhoto }: StepperItemProps) {
    const variant = pickVariant(entry);
    const StageIcon = STEP_ICON_MAP[entry.stage] ?? LeafIcon;

    // statusMessage: displayState.description (Figma — date + statusMessage 만 노출).
    const statusMessage = entry.displayState.description;

    // 날짜 노출 정책 (Figma):
    // - completed: completedAt 있으면 표시
    // - current/upcoming: 미노출
    const dateText =
        variant === 'completed' && entry.completedAt ? formatYmdShort(entry.completedAt) : null;

    return (
        <div className="flex gap-3">
            {/* 좌측: 28 icon 컬럼 + connector */}
            <div className="flex w-7 shrink-0 flex-col items-center">
                <StepperIcon shape="circle" status={variant} icon={StageIcon} className="shrink-0" />
                {!isLast && <Connector variant={variant} />}
            </div>

            {/* 우측: child (width 288), padding pb-5 */}
            <div className="flex w-72 flex-col gap-3 pb-5">
                <div className="flex flex-col gap-1">
                    {dateText && (
                        <p className="text-xs leading-4 text-foreground-tertiary">{dateText}</p>
                    )}
                    <p className="text-base font-semibold leading-5 text-foreground">
                        {statusMessage}
                    </p>
                </div>
                {entry.photos.length > 0 && (
                    <StepperItemMedia photos={entry.photos} onSelect={onSelectPhoto} />
                )}
            </div>
        </div>
    );
}

// connector: icon column 아래 세로 라인. flex-1로 child 높이 따라간다.
function Connector({ variant }: { variant: Variant }) {
    // completed → success-lighter, 그 외(current/upcoming) → muted(#F1F2F4, Figma connector fill).
    // 파트너 PartnerArtworkStepper 와 동일 토큰.
    const colorClass = variant === 'completed' ? 'bg-success-lighter' : 'bg-muted';
    return (
        <div
            className={`w-0.5 flex-1 ${colorClass}`}
            style={{ minHeight: '32px' }}
            aria-hidden="true"
        />
    );
}
