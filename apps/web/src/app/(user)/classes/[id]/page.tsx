'use client';

import { BottomBar, Button, PhotoIcon, ShareIcon, Tag } from '@todam/ui';
import { formatPrice } from '@todam/shared';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { getDifficultyLabel, useProgramReviews, usePublicProgramDetail } from '@/entities/program';
import { ClassDescription, ClassInfoTable } from '@/features/program/detail';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';

const DEFAULT_STORE_SLUG = 'todam-pottery';
const DEFAULT_STORE_NAME = '흙과 사람';

export default function ClassDetailPage() {
    return (
        <Suspense fallback={<ClassDetailLoading />}>
            <ClassDetailContent />
        </Suspense>
    );
}

function ClassDetailContent() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const programId = params.id;

    const storeSlug = searchParams.get('store') ?? searchParams.get('slug') ?? DEFAULT_STORE_SLUG;
    const storeName = searchParams.get('storeName') ?? DEFAULT_STORE_NAME;

    const detailQuery = usePublicProgramDetail(storeSlug, programId);
    const reviewsQuery = useProgramReviews(storeSlug, programId, { limit: 3 });
    const program = detailQuery.data?.program;
    const reviewCount = reviewsQuery.data?.totalCount ?? 0;

    useHeaderOverride({ title: storeName, hideRightAction: true });

    const heroImage = program?.images[0]?.imageUrl;
    const reviewsHref = `/classes/${programId}/reviews?store=${encodeURIComponent(storeSlug)}&storeName=${encodeURIComponent(storeName)}`;
    const reserveHref = program
        ? `/classes/${program.id}/reserve?title=${encodeURIComponent(program.title)}&price=${program.price}&deliverable=${program.deliverable}`
        : '#';

    async function handleShare() {
        if (!program || typeof window === 'undefined') return;
        const shareData = {
            title: program.title,
            text: `${storeName} ${program.title}`,
            url: window.location.href,
        };
        if (navigator.share) {
            await navigator.share(shareData);
            return;
        }
        await navigator.clipboard?.writeText(window.location.href);
    }

    if (detailQuery.isLoading) {
        return (
            <main className="min-h-full bg-[#FBF8F3] px-4 pb-[116px] pt-0">
                <SkeletonDetail />
            </main>
        );
    }

    if (detailQuery.isError || !program) {
        return (
            <main className="flex min-h-full flex-col items-center justify-center gap-4 bg-[#FBF8F3] px-4 text-center">
                <p className="text-sm text-foreground-secondary">
                    클래스 정보를 불러오지 못했어요.
                </p>
                <Button variant="outline" size="sm" onClick={() => detailQuery.refetch()}>
                    다시 시도
                </Button>
            </main>
        );
    }

    return (
        <main className="min-h-full bg-[#FBF8F3] pb-[116px]">
            <section className="px-4">
                <div className="relative flex aspect-[328/192] w-full items-center justify-center overflow-hidden bg-[#E9E0D3]">
                    {heroImage ? (
                        <img
                            src={heroImage}
                            alt={`${program.title} 클래스 이미지`}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded bg-[#3B342C] text-white">
                            <PhotoIcon size={24} />
                        </div>
                    )}
                    <Button
                        variant="overlay"
                        layout="onlyIcon"
                        size="sm"
                        icon={<ShareIcon />}
                        aria-label="공유하기"
                        onClick={handleShare}
                        className="absolute right-3 top-3"
                    />
                </div>
            </section>

            <section className="px-4 pb-[18px] pt-6">
                <div className="flex flex-wrap gap-1.5">
                    {program.difficulty && <Tag>{getDifficultyLabel(program.difficulty)}</Tag>}
                    {program.childFriendly && <Tag>어린이 가능</Tag>}
                    {program.deliverable && <Tag>배송 가능</Tag>}
                </div>

                <div className="mt-2">
                    <h1 className="text-2xl font-extrabold leading-8 text-foreground">
                        {program.title}
                    </h1>
                    <button
                        type="button"
                        onClick={() => router.push(reviewsHref)}
                        className="mt-3 text-sm font-semibold leading-[18px] text-foreground"
                    >
                        클래스 리뷰 {reviewCount.toLocaleString('ko-KR')}개
                    </button>
                </div>

                <div className="mt-4">
                    <ClassDescription description={program.description} />
                </div>

                <div className="mt-6">
                    <ClassInfoTable program={program} />
                </div>

                <div className="mt-4 rounded-lg border border-border-subtle bg-surface px-4 py-3">
                    <p className="text-xs font-semibold leading-4 text-foreground-secondary">
                        체험 정보
                    </p>
                    <p className="mt-3 text-xs leading-4 text-foreground-secondary">
                        체험 후 완성된 작품을 전달받기까지 약 {program.leadTimeDays}일 정도
                        소요돼요. 작품이 완성될 때까지 단계별 사진과 알림으로 작품 제작 과정을
                        보내드려요.
                    </p>
                </div>
            </section>

            <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2">
                <BottomBar>
                    <Button className="w-full" onClick={() => router.push(reserveHref)}>
                        {formatPrice(program.price)} 예약하기
                    </Button>
                </BottomBar>
            </div>
        </main>
    );
}

function ClassDetailLoading() {
    return (
        <main className="min-h-full bg-[#FBF8F3] px-4 pb-[116px] pt-0">
            <SkeletonDetail />
        </main>
    );
}

function SkeletonDetail() {
    return (
        <div className="space-y-6">
            <div className="aspect-[328/192] w-full animate-pulse bg-muted" />
            <div className="space-y-3">
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-8 w-44 animate-pulse rounded bg-muted" />
                <div className="h-5 w-28 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-60 w-full animate-pulse rounded-2xl bg-muted" />
        </div>
    );
}
