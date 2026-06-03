'use client';

import { Divider, Rating, SectionTitle } from '@todam/ui';
import type { ReservationDetail, ReviewDetail } from '@todam/shared';
import { formatScheduled } from '@todam/shared';

// 리뷰 상세 본문 — Figma 정본(`8507:23649`) 기준.
// 작품 정보 헤더(reservation 의존) + Rating display + Divider + 본문(읽기 전용) + Photo grid.
export type ReviewDetailContentProps = {
    review: ReviewDetail;
    reservation?: ReservationDetail;
};

function formatCreatedAt(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}. ${m}. ${day} 작성`;
}

export function ReviewDetailContent({ review, reservation }: ReviewDetailContentProps) {
    const hasContent = review.content.trim().length > 0;
    const hasPhotos = review.photos.length > 0;
    const scheduled = reservation ? formatScheduled(reservation.scheduledAt) : null;

    return (
        <div className="flex w-full flex-col">
            {/* 작품 정보 헤더 */}
            {reservation && (
                <div className="flex flex-col">
                    <SectionTitle title={reservation.programTitle} size="md" />
                    {scheduled && (
                        <p className="text-xs text-foreground-tertiary">
                            {reservation.storeName}・{scheduled.date} ({scheduled.day})
                        </p>
                    )}
                </div>
            )}

            {/* Rating display */}
            <div className="flex items-center gap-3 py-5">
                <Rating scope={review.rating} />
            </div>

            {(hasContent || hasPhotos) && <Divider />}

            {/* 본문 (읽기 전용) */}
            <div className="flex flex-col gap-1 py-2">
                <span className="px-1 text-sm font-semibold text-foreground-tertiary">
                    어떤 점이 좋았나요?
                </span>
                <div className="min-h-32 rounded-xl border border-border-subtle bg-surface p-4 text-base text-foreground">
                    {hasContent ? review.content : ''}
                </div>
            </div>

            {/* Photo grid */}
            {hasPhotos && (
                <div className="flex flex-col gap-1 py-2">
                    <span className="px-1 text-sm font-semibold text-foreground-tertiary">
                        사진
                    </span>
                    <div className="flex flex-wrap gap-4">
                        {review.photos.map((photo) => (
                            <img
                                key={photo.id}
                                src={photo.imageUrl}
                                alt="리뷰 사진"
                                className="h-20 w-28 rounded-2xl bg-muted object-cover"
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 작성일 */}
            <p className="py-2 text-xs text-foreground-tertiary">
                {formatCreatedAt(review.createdAt)}
            </p>
        </div>
    );
}
