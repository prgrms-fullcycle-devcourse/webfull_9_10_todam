'use client';

import { RightIcon, SectionTitle } from '@todam/ui';
import type { ReservationDetail } from '@todam/shared';

import { useToast } from '../../../../../../shared/model';

import { ReservationStatusBadge } from '../../../../../../entities/reservation';

// 디자인 정본 (변형 B/C) — Figma `8118:2615` 작품 제작 단계 카드.
// status=IN_PROGRESS 시에만 렌더. Badge(substate) + statusMessage + ProgressBar + "N단계 남음" + 자세히보기.
// 자세히보기: 별도 endpoint 필요 — 본 작업 범위 밖. placeholder 동작.
export type ArtworkStageCardProps = {
    reservation: ReservationDetail;
};

export function ArtworkStageCard({ reservation }: ArtworkStageCardProps) {
    const { push } = useToast();
    const artwork = reservation.artwork;
    if (!artwork) return null;

    const handleViewDetail = () => {
        push({ message: '작품 제작 단계 자세히보기는 곧 지원돼요.' });
    };

    return (
        <section className="flex w-full flex-col gap-2">
            <SectionTitle title="작품 제작 단계" size="md" />

            <div className="flex w-full flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-4">
                <div className="flex flex-col gap-2">
                    <ReservationStatusBadge
                        status={reservation.status}
                        label={reservation.displayState.subLabel ?? reservation.displayState.label}
                    />
                    <p className="text-base font-semibold leading-5 text-foreground">
                        {reservation.displayState.description}
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    {/* 디자인 정본 — fill 색 info-darker. ProgressBar 공용 컴포넌트는 fill 색 prop 미노출이라 직접 구현. */}
                    <div
                        role="progressbar"
                        aria-valuenow={artwork.progressPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                    >
                        <div
                            className="h-full rounded-full bg-info-darker transition-all duration-300"
                            style={{
                                width: `${Math.min(100, Math.max(0, artwork.progressPercent))}%`,
                            }}
                        />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-foreground-tertiary">
                            완성까지 {artwork.remainingSteps}단계 남음
                        </span>
                        <button
                            type="button"
                            onClick={handleViewDetail}
                            className="flex items-center gap-1 text-xs text-foreground-secondary"
                        >
                            자세히보기
                            <RightIcon size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
