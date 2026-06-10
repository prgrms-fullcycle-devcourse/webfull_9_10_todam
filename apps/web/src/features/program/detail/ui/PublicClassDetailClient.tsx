'use client';

import { BottomBar, Button, RightIcon, ShareIcon, Tag } from '@todam/ui';
import { formatPrice } from '@todam/shared';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import {
    ClassDetailHero,
    ClassDetailSkeleton,
    getDifficultyLabel,
    useProgramReviews,
    usePublicProgramDetail,
} from '@/entities/program';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';

import { ClassDescription } from './ClassDescription';
import { ClassInfoTable } from './ClassInfoTable';

export function PublicClassDetailClient() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const programId = params.id;

    // 클래스 상세는 `?store=<slug>&storeName=<name>` 쿼리로 진입(목록 링크가 부착).
    // 쿼리 없이 직접 진입 시 slug 없음 → 쿼리 미실행 → !program 분기로 에러 상태 노출.
    const storeSlug = searchParams.get('store') ?? searchParams.get('slug') ?? '';
    const storeName = searchParams.get('storeName') ?? '';

    const detailQuery = usePublicProgramDetail(storeSlug, programId);
    const reviewsQuery = useProgramReviews(storeSlug, programId, { limit: 3 });
    const program = detailQuery.data?.program;
    const reviewCount = reviewsQuery.data?.totalCount ?? 0;

    useHeaderOverride({ title: storeName || program?.title, hideRightAction: true });

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
        return <ClassDetailSkeleton />;
    }

    if (detailQuery.isError || !program) {
        return (
            <main className="flex min-h-full flex-col items-center justify-center gap-4 px-4 text-center">
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
        <>
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                {/* 대표 이미지 */}
                <div className="py-2">
                    <ClassDetailHero
                        imageUrl={program.images[0]?.imageUrl}
                        alt={program.title}
                        priority
                        overlay={
                            <Button
                                variant="overlay"
                                layout="onlyIcon"
                                size="sm"
                                icon={<ShareIcon />}
                                aria-label="공유하기"
                                onClick={handleShare}
                            />
                        }
                    />
                </div>

                {/* 클래스 기본 정보 */}
                <section className="flex flex-col gap-3 py-2">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1">
                            {program.difficulty && (
                                <Tag className="!bg-primary-subtle !text-primary-darker">
                                    {getDifficultyLabel(program.difficulty)}
                                </Tag>
                            )}
                            {program.childFriendly && <Tag>어린이 가능</Tag>}
                            {program.deliverable && <Tag>배송 가능</Tag>}
                        </div>
                        <h1 className="text-2xl font-extrabold leading-8 text-foreground">
                            {program.title}
                        </h1>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push(reviewsHref)}
                        className="flex w-fit items-center text-sm font-semibold text-foreground"
                    >
                        클래스 리뷰 {reviewCount.toLocaleString('ko-KR')}개
                        <RightIcon size={16} />
                    </button>

                    <ClassDescription description={program.description} />
                </section>

                {/* 클래스 상세 정보 테이블 */}
                <section className="py-2">
                    <ClassInfoTable program={program} />
                </section>
            </main>

            {/* 하단 고정 CTA */}
            <BottomBar>
                <Button className="w-full" onClick={() => router.push(reserveHref)}>
                    {formatPrice(program.price)} 예약하기
                </Button>
            </BottomBar>
        </>
    );
}
