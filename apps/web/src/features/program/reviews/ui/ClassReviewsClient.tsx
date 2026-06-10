'use client';

import { formatYmd, type ProgramReview, type ProgramReviewSort } from '@todam/shared';
import { Button, CloseIcon, Rating } from '@todam/ui';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { useProgramReviews } from '@/entities/program';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useModal } from '@/shared/model';

const REVIEW_PAGE_SIZE = 10;

const SORT_OPTIONS: Array<{ value: ProgramReviewSort; label: string }> = [
    { value: 'latest', label: '최신순' },
    { value: 'rating_high', label: '별점순' },
];

export function ClassReviewsClient() {
    const params = useParams<{ id: string }>();
    const programId = params.id;

    const [sort, setSort] = useState<ProgramReviewSort>('latest');
    const [page, setPage] = useState(1);
    const { open, close } = useModal();

    const reviewsQuery = useProgramReviews(programId, {
        page,
        limit: REVIEW_PAGE_SIZE,
        sort,
    });

    const data = reviewsQuery.data;
    const reviews = data?.reviews ?? [];
    const totalPages = data?.pagination.totalPages ?? 0;
    const averageRating = data?.averageRating ?? 0;
    const totalCount = data?.totalCount ?? 0;

    useHeaderOverride({ title: '클래스 리뷰', hideRightAction: true });

    const changeSort = (nextSort: ProgramReviewSort) => {
        setSort(nextSort);
        setPage(1);
    };

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

    return (
        <main className="min-h-full bg-[#FBF8F3] px-4 pb-20 pt-2">
            <section className="rounded-lg bg-surface px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <p className="text-xs font-semibold text-foreground-tertiary">총 리뷰</p>
                        <p className="text-xl font-extrabold leading-7 text-foreground">
                            {totalCount.toLocaleString('ko-KR')}개
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <Rating scope={Math.round(averageRating)} />
                            <span className="text-lg font-bold text-foreground">
                                {averageRating.toFixed(1)}
                            </span>
                        </div>
                        <p className="text-xs text-foreground-tertiary">평균 별점</p>
                    </div>
                </div>
            </section>

            <div className="sticky top-0 z-10 -mx-4 bg-[#FBF8F3] px-4 py-3">
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
                                onClick={() => changeSort(option.value)}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {reviewsQuery.isLoading && <ReviewSkeletonList />}

            {!reviewsQuery.isLoading && reviewsQuery.isError && (
                <div className="flex min-h-80 flex-col items-center justify-center gap-4 text-center">
                    <p className="text-sm text-foreground-secondary">리뷰를 불러오지 못했어요.</p>
                    <Button variant="outline" size="sm" onClick={() => reviewsQuery.refetch()}>
                        다시 시도
                    </Button>
                </div>
            )}

            {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 && (
                <div className="flex min-h-80 items-center justify-center text-center">
                    <p className="text-sm text-foreground-secondary">
                        아직 등록된 리뷰가 없습니다.
                    </p>
                </div>
            )}

            {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length > 0 && (
                <div className="divide-y divide-border-subtle">
                    {reviews.map((review) => (
                        <ClassReviewCard key={review.id} review={review} onOpenImage={openImage} />
                    ))}
                </div>
            )}

            {!reviewsQuery.isLoading && !reviewsQuery.isError && totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    >
                        이전
                    </Button>
                    <span className="min-w-16 text-center text-sm font-semibold text-foreground-secondary">
                        {page} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                        다음
                    </Button>
                </div>
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
