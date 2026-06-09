'use client';

import { useQuery } from '@tanstack/react-query';
import { formatPrice, formatDuration } from '@todam/shared';
import { Button, Divider, RightIcon, SectionTitle, Rating, ShareIcon } from '@todam/ui';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { getDifficultyLabel } from '@/entities/program/lib/difficulty';
import { ClassItem } from '@/entities/program/ui/ClassItem';
import { ConvenienceChips } from '@/entities/store/ui/ConvenienceChips';
import { StoreImageCarousel } from '@/entities/store/ui/StoreImageCarousel';
import { StoreInfoSummary } from '@/entities/store/ui/StoreInfoSummary';
import { StoreLocation } from '@/entities/store/ui/StoreLocation';
import { FavoriteToggleButton } from '@/features/store/toggle-favorite/ui/FavoriteToggleButton';
import { getStoreReviews } from '@/features/store/reviews/api';
import { ApiError } from '@/shared/api';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useToast } from '@/shared/model';

import { retryExceptNotFound, usePublicStoreDetail, usePublicStorePrograms } from '../queries';

// 리뷰 미리보기 쿼리 (limit=3, sort=latest — Contract C)
function useStoreReviewsPreview(slug: string) {
    return useQuery({
        queryKey: ['public', 'stores', slug, 'reviews-preview'],
        queryFn: () => getStoreReviews(slug, { limit: 3, sort: 'latest' }),
        enabled: Boolean(slug),
        retry: retryExceptNotFound,
        staleTime: 60_000,
    });
}

export function StoreDetailClient() {
    const params = useParams<{ slug: string }>();
    const slug = params.slug;
    const router = useRouter();
    const { push: pushToast } = useToast();

    const detailQuery = usePublicStoreDetail(slug);
    const programsQuery = usePublicStorePrograms(slug);
    const reviewsQuery = useStoreReviewsPreview(slug);

    const store = detailQuery.data?.store;

    // 헤더 타이틀을 공방명으로 동적화
    useHeaderOverride({
        title: store?.name ?? '공방 상세',
        hideRightAction: true,
    });

    const handleShare = useCallback(async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: store?.name ?? '공방', url });
            } catch {
                // 공유 취소 무시
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                pushToast({ message: '링크를 복사했어요.' });
            } catch {
                pushToast({ message: '링크 복사에 실패했어요.' });
            }
        }
    }, [store, pushToast]);

    // 404 상태
    const is404 =
        detailQuery.isError &&
        detailQuery.error instanceof ApiError &&
        detailQuery.error.statusCode === 404;

    if (is404) {
        return (
            <main className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-20 text-center">
                <p className="text-base font-semibold text-foreground">공방을 찾을 수 없어요.</p>
                <p className="text-sm text-foreground-secondary">
                    삭제되거나 비공개 처리된 공방이에요.
                </p>
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                    돌아가기
                </Button>
            </main>
        );
    }

    // 네트워크/서버 에러
    if (detailQuery.isError && !is404) {
        return (
            <main className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-20 text-center">
                <p className="text-base font-semibold text-foreground">정보를 불러오지 못했어요.</p>
                <p className="text-sm text-foreground-secondary">잠시 후 다시 시도해주세요.</p>
                <Button variant="outline" size="sm" onClick={() => detailQuery.refetch()}>
                    다시 시도
                </Button>
            </main>
        );
    }

    // 로딩
    if (detailQuery.isLoading || !store) {
        return <StoreDetailSkeleton />;
    }

    const programs = programsQuery.data?.programs ?? [];
    const reviews = reviewsQuery.data?.reviews ?? [];

    // 이미지 배열을 StoreImageCarousel이 요구하는 형태로 변환 (sortOrder 추가)
    const carouselImages = store.images.map((img, idx) => ({
        id: `img-${idx}`,
        imageUrl: img.imageUrl,
        thumbnailUrl: img.thumbnailUrl ?? img.imageUrl, // thumbnail 없으면 원본으로 폴백
        isThumbnail: idx === 0,
        sortOrder: idx,
    }));

    return (
        <main className="min-h-full bg-background pb-20">
            {/* 이미지 캐러셀 */}
            <div className="relative">
                <StoreImageCarousel images={carouselImages} />
                {/* 찜 버튼 (캐러셀 우하단 오버레이) */}
                <div className="absolute bottom-3 right-3 z-10">
                    <FavoriteToggleButton storeId={store.id} initialFavorite={store.isFavorite} />
                </div>
            </div>

            <div className="flex flex-col gap-6 px-4 pt-5">
                {/* 기본 정보 */}
                <StoreInfoSummary
                    name={store.name}
                    rating={store.rating ?? 0}
                    reviewCount={store.reviewCount}
                    description={store.description}
                    tags={<ConvenienceChips convenienceInfo={store.convenienceInfo} />}
                    actions={
                        <button
                            type="button"
                            onClick={handleShare}
                            aria-label="공유하기"
                            className="ml-auto flex items-center gap-1 text-xs text-foreground-tertiary"
                        >
                            <ShareIcon size={14} />
                            공유
                        </button>
                    }
                />

                <Divider />

                {/* 운영 클래스 */}
                <section className="flex flex-col gap-3">
                    <SectionTitle
                        title={`운영 클래스 ${programs.length > 0 ? `${programs.length}개` : ''}`}
                    />
                    {programsQuery.isLoading && (
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
                            ))}
                        </div>
                    )}
                    {!programsQuery.isLoading && programs.length === 0 && (
                        <div className="flex min-h-24 items-center justify-center rounded-2xl border border-border-subtle">
                            <p className="text-sm text-foreground-tertiary">준비 중입니다.</p>
                        </div>
                    )}
                    {!programsQuery.isLoading && programs.length > 0 && (
                        <div className="flex flex-col gap-3">
                            {programs.map((program) => {
                                const metaItems = [
                                    getDifficultyLabel(program.difficulty),
                                    formatDuration(program.durationMinutes),
                                    `평균 ${program.leadTimeDays}일`,
                                ];
                                return (
                                    <Link
                                        key={program.id}
                                        href={`/stores/${slug}/programs/${program.id}`}
                                        className="block"
                                    >
                                        <ClassItem
                                            programName={program.title}
                                            metaItems={metaItems}
                                            price={formatPrice(program.price)}
                                        />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>

                <Divider />

                {/* 리뷰 미리보기 */}
                <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <SectionTitle
                            title={`리뷰 ${store.reviewCount > 0 ? `${store.reviewCount.toLocaleString('ko-KR')}건` : ''}`}
                        />
                        {store.reviewCount > 0 && (
                            <Link
                                href={`/stores/${slug}/reviews`}
                                className="flex items-center gap-0.5 text-xs font-medium text-foreground-secondary"
                            >
                                전체보기
                                <RightIcon size={14} />
                            </Link>
                        )}
                    </div>

                    {reviewsQuery.isLoading && (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                                    <div className="h-7 w-20 animate-pulse rounded-lg bg-muted" />
                                </div>
                            ))}
                        </div>
                    )}

                    {!reviewsQuery.isLoading && reviewsQuery.isError && (
                        <div className="flex min-h-16 items-center justify-center gap-3">
                            <p className="text-sm text-foreground-tertiary">
                                리뷰를 불러오지 못했어요.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => reviewsQuery.refetch()}
                            >
                                다시 시도
                            </Button>
                        </div>
                    )}

                    {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 && (
                        <div className="flex min-h-16 items-center justify-center">
                            <p className="text-sm text-foreground-tertiary">
                                아직 등록된 리뷰가 없어요.
                            </p>
                        </div>
                    )}

                    {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length > 0 && (
                        <div className="divide-y divide-border-subtle">
                            {reviews.map((review) => (
                                <ReviewPreviewCard key={review.id} review={review} />
                            ))}
                        </div>
                    )}
                </section>

                <Divider />

                {/* 위치 */}
                <section className="flex flex-col gap-3">
                    <SectionTitle title="위치" />
                    <StoreLocation
                        address={store.address}
                        latitude={store.location.lat}
                        longitude={store.location.lng}
                        name={store.name}
                    />
                </section>

                {/* 연락처 */}
                <section className="flex flex-col gap-1">
                    <SectionTitle title="연락처" />
                    <a
                        href={`tel:${store.phone}`}
                        className="text-sm font-medium text-foreground-secondary"
                    >
                        {store.phone}
                    </a>
                </section>
            </div>
        </main>
    );
}

// 리뷰 미리보기 카드 (Contract C 필드 사용)
function ReviewPreviewCard({
    review,
}: {
    review: {
        id: string;
        nickname: string;
        rating: number;
        content: string;
        photos: { imageUrl: string; thumbnailUrl: string }[];
        programTitle: string;
        createdAt: string;
    };
}) {
    const ratingLabel = Number.isInteger(review.rating)
        ? `${review.rating}.0`
        : String(review.rating);

    return (
        <article className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-2">
                <Rating scope={Math.round(review.rating)} />
                <span className="text-sm font-semibold text-foreground-secondary">
                    {ratingLabel}
                </span>
                <span className="ml-auto text-xs text-foreground-tertiary">{review.nickname}</span>
            </div>

            {review.content && (
                <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-5 text-foreground">
                    {review.content}
                </p>
            )}

            {review.photos.length > 0 && (
                <div className="flex gap-2">
                    {review.photos.slice(0, 3).map((photo, idx) => (
                        <div
                            key={`${review.id}-photo-${idx}`}
                            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
                        >
                            <Image
                                src={photo.thumbnailUrl}
                                alt=""
                                fill
                                sizes="80px"
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    ))}
                </div>
            )}

            <span className="inline-flex h-7 w-fit items-center rounded-lg border border-border px-3 text-xs text-foreground-secondary">
                {review.programTitle}
            </span>
        </article>
    );
}

// 스켈레톤 로딩
function StoreDetailSkeleton() {
    return (
        <div className="min-h-full bg-background">
            <div className="aspect-[3/2] w-full animate-pulse bg-muted" />
            <div className="flex flex-col gap-6 px-4 pt-5">
                <div className="flex flex-col gap-3">
                    <div className="h-8 w-40 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-px bg-border" />
                <div className="flex flex-col gap-3">
                    <div className="h-5 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-20 animate-pulse rounded-2xl bg-muted" />
                    <div className="h-20 animate-pulse rounded-2xl bg-muted" />
                </div>
            </div>
        </div>
    );
}
