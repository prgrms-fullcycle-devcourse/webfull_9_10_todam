'use client';

import { formatYmd, type ProgramReview, type ProgramReviewSort } from '@todam/shared';
import { Button, CloseIcon, Divider, Rating, SegmentedControl } from '@todam/ui';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

import { useProgramReviewsInfinite } from '@/entities/program';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useModal } from '@/shared/model';

const SORT_OPTIONS: Array<{ value: ProgramReviewSort; label: string }> = [
    { value: 'latest', label: '최신순' },
    { value: 'rating_high', label: '별점순' },
];

// 클래스 리뷰 전체보기. 공방 리뷰 전체보기(StudioReviewsClient)와 동일 구성
export function ClassReviewsClient() {
    const params = useParams<{ id: string }>();
    const programId = params.id;
    const [sort, setSort] = useState<ProgramReviewSort>('latest');
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const { open, close } = useModal();

    const reviewsQuery = useProgramReviewsInfinite(programId, sort);
    const fetchNextPage = reviewsQuery.fetchNextPage;
    const hasNextPage = reviewsQuery.hasNextPage;
    const isFetchingNextPage = reviewsQuery.isFetchingNextPage;
    const reviews = useMemo(
        () => reviewsQuery.data?.pages.flatMap((page) => page.reviews) ?? [],
        [reviewsQuery.data],
    );

    useHeaderOverride({ title: '클래스 리뷰', hideRightAction: true });

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

    const openImage = (src: string) => {
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
                        alt="리뷰 이미지"
                        fill
                        sizes="100vw"
                        className="object-contain"
                        unoptimized
                    />
                </div>
            </div>,
        );
    };

    const isInitialLoading = reviewsQuery.isLoading;
    const isError = reviewsQuery.isError;

    return (
        <main className="min-h-full bg-background px-4 pb-16">
            <div className="sticky top-0 z-10 -mx-4 bg-background px-4 pb-9">
                <SegmentedControl
                    options={SORT_OPTIONS.map((option) => option.label)}
                    selected={SORT_OPTIONS.findIndex((option) => option.value === sort)}
                    onSelectedChange={(index) => {
                        const next = SORT_OPTIONS[index];
                        if (next) setSort(next.value);
                    }}
                />
            </div>

            {isInitialLoading && <ReviewSkeletonList />}

            {!isInitialLoading && isError && (
                <div className="flex min-h-80 flex-col items-center justify-center gap-4 text-center">
                    <p className="text-sm text-foreground-secondary">리뷰를 불러오지 못했어요.</p>
                    <Button variant="outline" size="sm" onClick={() => reviewsQuery.refetch()}>
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
                <div className="flex flex-col">
                    {reviews.map((review, index) => (
                        <Fragment key={review.id}>
                            <ClassReviewCard review={review} onOpenImage={openImage} />
                            {index < reviews.length - 1 && <Divider className="py-9" />}
                        </Fragment>
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

function ClassReviewCard({
    review,
    onOpenImage,
}: {
    review: ProgramReview;
    onOpenImage: (src: string) => void;
}) {
    const ratingLabel = Number.isInteger(review.rating)
        ? `${review.rating}.0`
        : String(review.rating);
    const createdAt = formatYmd(review.createdAt);

    return (
        <article className="flex flex-col gap-4">
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

            <section className="flex flex-col gap-3">
                {review.content && (
                    <p className="whitespace-pre-wrap text-sm leading-5 text-foreground">
                        {review.content}
                    </p>
                )}

                {review.photos.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto">
                        {review.photos.slice(0, 3).map((photo, index) => (
                            <button
                                key={`${review.id}-${photo.imageUrl}-${index}`}
                                type="button"
                                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted"
                                onClick={() => onOpenImage(photo.imageUrl)}
                            >
                                <Image
                                    src={photo.imageUrl}
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
            </section>
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
                    <div className="flex gap-2">
                        <div className="h-24 w-24 animate-pulse rounded-lg bg-muted" />
                        <div className="h-24 w-24 animate-pulse rounded-lg bg-muted" />
                    </div>
                </div>
            ))}
        </div>
    );
}
