'use client';

import { CheckIcon } from '@todam/ui';
import type { ArtworkPhoto, ArtworkTimelineEntry } from '@todam/shared';

import { StepperItemMedia } from './StepperItemMedia';

// 타임라인 단일 항목 (Figma `8505:15922` / `8505:16209`).
// variant 결정 로직:
//   - isCompleted=true → completed
//   - isCurrent=true → current
//   - 그 외 → upcoming
// isLast 일 때 connector 미노출.
//
// Design tokens (plan §Design tokens):
// - 좌측 28×28 icon 컬럼 + 우측 child(width 288), gap 12
// - completed: bg #128951 (green-500), 흰 체크
// - current: bg #CCDFF6 (blue-100/info-subtle), stroke #0A3A63 (info-darker)
// - upcoming: bg surface(white), stroke #C8CBD1 (border), icon #7D838D (foreground-tertiary)
// - connector: completed→bg #46C488(green-300/success-lighter), 그 외 #C8CBD1(border)
//   ※ current→다음 connector 색은 Figma 노드 재확인 어려움 → plan Risks 기록대로
//     border-default(#C8CBD1)로 잠정 처리. 미완료 구간이므로 일관성 있음.

type Variant = 'completed' | 'current' | 'upcoming';

function pickVariant(entry: ArtworkTimelineEntry): Variant {
    if (entry.isCompleted) return 'completed';
    if (entry.isCurrent) return 'current';
    return 'upcoming';
}

// 날짜 표시: YY.MM.DD (정본 예시 26.04.03 형식).
function formatDate(iso: string): string {
    const d = new Date(iso);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}.${mm}.${dd}`;
}

export type StepperItemProps = {
    entry: ArtworkTimelineEntry;
    isLast: boolean;
    onSelectPhoto: (photo: ArtworkPhoto) => void;
};

export function StepperItem({ entry, isLast, onSelectPhoto }: StepperItemProps) {
    const variant = pickVariant(entry);

    // statusMessage: displayState.description (Figma — date + statusMessage 만 노출).
    const statusMessage = entry.displayState.description;

    // 날짜 노출 정책 (Figma):
    // - completed: completedAt 있으면 표시
    // - current/upcoming: 미노출
    const dateText =
        variant === 'completed' && entry.completedAt ? formatDate(entry.completedAt) : null;

    return (
        <div className="flex gap-3">
            {/* 좌측: 28 icon 컬럼 + connector */}
            <div className="flex w-7 flex-col items-center">
                <IconCircle variant={variant} />
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

// 28×28 원형 아이콘. variant 별 색.
function IconCircle({ variant }: { variant: Variant }) {
    if (variant === 'completed') {
        return (
            <div
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ backgroundColor: '#128951' }}
                aria-hidden="true"
            >
                <CheckIcon size={20} className="text-foreground-inverse" />
            </div>
        );
    }
    if (variant === 'current') {
        return (
            <div
                className="flex h-7 w-7 items-center justify-center rounded-full bg-info-subtle"
                aria-hidden="true"
            >
                <div className="h-2 w-2 rounded-full bg-info-darker" />
            </div>
        );
    }
    // upcoming
    return (
        <div
            className="flex h-7 w-7 items-center justify-center rounded-full border bg-surface"
            style={{ borderColor: '#C8CBD1' }}
            aria-hidden="true"
        >
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#7D838D' }} />
        </div>
    );
}

// connector: icon column 아래 세로 라인. flex-1로 child 높이 따라간다.
function Connector({ variant }: { variant: Variant }) {
    // completed→completed/current connector: success-lighter (#46C488)
    // 그 외 (current→upcoming, upcoming→upcoming): border-default (#C8CBD1)
    const color = variant === 'completed' ? '#46C488' : '#C8CBD1';
    return (
        <div
            className="w-0.5 flex-1"
            style={{ backgroundColor: color, minHeight: '32px' }}
            aria-hidden="true"
        />
    );
}
