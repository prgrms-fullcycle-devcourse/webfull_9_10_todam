'use client';

import type { ArtworkPhoto, ArtworkTimelineEntry } from '@todam/shared';

import { StepperItem } from './StepperItem';

// 작품 제작 단계 전체 타임라인 (Figma `8505:15922`).
// - vertical container, 항목 간 padding 은 StepperItem 의 pb-5 로 처리.
// - 마지막 항목은 connector 미노출 (isLast=true).
export type StepperProps = {
    timeline: ArtworkTimelineEntry[];
    onSelectPhoto: (photo: ArtworkPhoto) => void;
};

export function Stepper({ timeline, onSelectPhoto }: StepperProps) {
    return (
        <div className="flex flex-col">
            {timeline.map((entry, idx) => (
                <StepperItem
                    key={`${entry.stage}-${idx}`}
                    entry={entry}
                    isLast={idx === timeline.length - 1}
                    onSelectPhoto={onSelectPhoto}
                />
            ))}
        </div>
    );
}
