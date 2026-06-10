'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { StoreReviewListItem } from '@todam/shared';

import { CardItem } from '@/entities/review';
import { useStoreReviewsPreview } from '@/features/store/reviews';

const PREVIEW_COUNT = 3;

// 메인 노출 정렬: 별점 높은 순(BE sort=rating_high) + 이미지·내용 모두 있는 리뷰 우선(클라 재정렬).
function isRich(review: StoreReviewListItem): boolean {
    return review.photos.length > 0 && review.content.trim().length > 0;
}

function selectPreviewReviews(reviews: StoreReviewListItem[]): StoreReviewListItem[] {
    // rating_high 순서를 보존하면서 rich 리뷰를 앞으로(안정 정렬).
    const ordered = [...reviews].sort((a, b) => Number(isRich(b)) - Number(isRich(a)));
    return ordered.slice(0, PREVIEW_COUNT);
}

// 파트너 공방 상세 미리보기 리뷰: 가로 스와이프 3개. 리뷰 없으면 섹션 비표시.
// 카드는 리뷰 엔티티 공용 CardItem 재사용(image/contents 유무로 full·emptyPhoto·emptyContents 분기).
export function StoreReviewPreview({ slug }: { slug: string }) {
    const router = useRouter();
    const { data, isLoading } = useStoreReviewsPreview(slug);

    const previews = useMemo(() => (data ? selectPreviewReviews(data.reviews) : []), [data]);

    if (isLoading) {
        return (
            <div className="flex gap-2 py-2">
                {Array.from({ length: PREVIEW_COUNT }).map((_, index) => (
                    <div
                        key={index}
                        className="h-20 w-64 shrink-0 animate-pulse rounded-2xl bg-muted"
                    />
                ))}
            </div>
        );
    }

    if (previews.length === 0) return null;

    return (
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto py-2">
            {previews.map((review) => {
                const thumbnail = review.photos[0]?.thumbnailUrl;
                return (
                    <CardItem
                        key={review.id}
                        rating={review.rating}
                        contents={review.content}
                        image={
                            thumbnail
                                ? { src: thumbnail, alt: `${review.programTitle} 리뷰 이미지` }
                                : undefined
                        }
                    />
                );
            })}
            {/* 리뷰 1개 이상일 때 전체보기 진입(공개 공방 리뷰 목록). 개별 리뷰 상세는 후속 과제. */}
            <button
                type="button"
                onClick={() => router.push(`/stores/${slug}/reviews`)}
                className="flex h-20 w-20 shrink-0 snap-start cursor-pointer items-center justify-center whitespace-pre-line rounded-2xl border border-border-subtle bg-surface text-center text-xs font-semibold leading-4 text-foreground"
            >
                {'리뷰\n전체보기'}
            </button>
        </div>
    );
}
