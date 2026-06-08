'use client';

import { formatYmd, type StoreReviewListItem, type StoreReviewSort } from '@todam/shared';
import { Button, CloseIcon, Rating } from '@todam/ui';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useModal } from '@/shared/model';

import { usePublicStoreName, useStoreReviewsInfinite } from '../queries';

const SORT_OPTIONS: Array<{ value: StoreReviewSort; label: string }> = [
    { value: 'latest', label: '최신순' },
    { value: 'rating_high', label: '별점순' },
];

export function StoreReviewsClient() {
    const params = useParams<{ slug: string }>();
    const slug = params.slug;
    const [sort, setSort] = useState<StoreReviewSort>('latest');
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const { open, close } = useModal();

    const storeQuery = usePublicStoreName(slug);
    const reviewsQuery = useStoreReviewsInfinite(slug, sort);
    const storeName = storeQuery.data?.store.name;
    const fetchNextPage = reviewsQuery.fetchNextPage;
    const refetchReviews = reviewsQuery.refetch;
    const hasNextPage = reviewsQuery.hasNextPage;
    const isFetchingNextPage = reviewsQuery.isFetchingNextPage;
    const reviews = useMemo(
        () => reviewsQuery.data?.pages.flatMap((page) => page.reviews) ?? [],
        [reviewsQuery.data],
    );

    useHeaderOverride({
        title: `${storeName ?? '공방'} 리뷰`,
        hideRightAction: true,
    });

    useEffect(() => {
        const node = sentinelRef.current;
        if (!node || !hasNextPage) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting && !isFetchingNextPage) {
                    void fetchNextPage();
                }
            },
            { rootMargin: '160px 0px' },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const openImage = (src: string, alt: string) => {
        open(
            <div className="relative w-full" onClick={(event) => event.stopPropagation()}>
                <button
                    type="button"
                    className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-inverse/80 text-foreground-inverse"
                    onClick={close}
                    aria-label="이미지 닫기"
                >
                    <CloseIcon size={20} />
                </button>
                <div className="relative h-screen max-h-screen w-full">
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        sizes="100vw"
                        className="object-contain"
                        unoptimized
                    />
                </div>
            </div>,
        );
    };

    const isInitialLoading = storeQuery.isLoading || reviewsQuery.isLoading;
    const isError = storeQuery.isError || reviewsQuery.isError;

    return (
        <main className="min-h-full bg-background px-4 pb-20 pt-2">
            <div className="sticky top-0 z-10 -mx-4 bg-background px-4 py-3">
                <div className="grid grid-cols-2 rounded-lg bg-surface-secondary p-1">
                    {SORT_OPTIONS.map((option) => {
                        const selected = sort === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                className={[
                                    'h-9 rounded-md text-sm font-semibold',
                                    selected
                                        ? 'bg-surface text-foreground shadow-sm'
                                        : 'text-foreground-tertiary hover:text-foreground',
                                ].join(' ')}
                                onClick={() => setSort(option.value)}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {isInitialLoading && <ReviewSkeletonList />}

            {!isInitialLoading && isError && (
                <div className="flex min-h-80 flex-col items-center justify-center gap-4 text-center">
                    <p className="text-sm text-foreground-secondary">리뷰를 불러오지 못했어요.</p>
                    <Button variant="outline" size="sm" onClick={() => refetchReviews()}>
                        다시 시도
                    </Button>
                </div>
            )}

            {!isInitialLoading && !isError && reviews.length === 0 && (
                <div className="flex min-h-80 items-center justify-center text-center">
                    <p className="text-sm text-foreground-secondary">
                        아직 등록된 리뷰가 없습니다.
                    </p>
                </div>
            )}

            {!isInitialLoading && !isError && reviews.length > 0 && (
                <div className="divide-y divide-border-subtle">
                    {reviews.map((review) => (
                        <StoreReviewCard key={review.id} review={review} onOpenImage={openImage} />
                    ))}
                </div>
            )}

            <div ref={sentinelRef} className="h-10" />
            {isFetchingNextPage && (
                <p className="py-4 text-center text-xs text-foreground-tertiary">
                    리뷰를 더 불러오는 중...
                </p>
            )}
        </main>
    );
}

function StoreReviewCard({
    review,
    onOpenImage,
}: {
    review: StoreReviewListItem;
    onOpenImage: (src: string, alt: string) => void;
}) {
    const ratingLabel = Number.isInteger(review.rating)
        ? `${review.rating}.0`
        : String(review.rating);
    const createdAt = formatYmd(review.createdAt);

    return (
        <article className="flex flex-col gap-3 py-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Rating scope={Math.round(review.rating)} />
                        <span className="text-sm font-semibold text-foreground-secondary">
                            {ratingLabel}
                        </span>
                    </div>
                    <span className="text-xs text-foreground-tertiary">{review.nickname}</span>
                </div>
                {createdAt && (
                    <time className="text-xs text-foreground-tertiary" dateTime={review.createdAt}>
                        {createdAt}
                    </time>
                )}
            </div>

            {review.content && (
                <p className="whitespace-pre-wrap text-sm leading-5 text-foreground">
                    {review.content}
                </p>
            )}

            {review.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {review.photos.slice(0, 3).map((photo, index) => (
                        <button
                            key={`${review.id}-${photo.thumbnailUrl}-${index}`}
                            type="button"
                            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted"
                            onClick={() =>
                                onOpenImage(photo.imageUrl, `${review.programTitle} 리뷰 이미지`)
                            }
                        >
                            <Image
                                src={photo.thumbnailUrl}
                                alt=""
                                fill
                                sizes="96px"
                                className="object-cover"
                                unoptimized
                            />
                        </button>
                    ))}
                </div>
            )}

            <span className="inline-flex h-7 w-fit items-center rounded-lg border border-border px-3 text-xs text-foreground-secondary">
                {review.programTitle}
            </span>
        </article>
    );
}

function ReviewSkeletonList() {
    return (
        <div className="divide-y divide-border-subtle">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-3 py-5">
                    <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    <div className="space-y-2">
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-7 w-24 animate-pulse rounded-lg bg-muted" />
                </div>
            ))}
        </div>
    );
}
