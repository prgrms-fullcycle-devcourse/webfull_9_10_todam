'use client';

import { useQueryClient } from '@tanstack/react-query';
import { formatPrice, formatDuration } from '@todam/shared';
import { Button, Divider, LeftIcon, SectionTitle, SpaceBlock } from '@todam/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { getDifficultyLabel } from '@/entities/program/lib/difficulty';
import { ClassItem } from '@/entities/program/ui/ClassItem';
import {
    ConvenienceChips,
    StudioDetailSkeleton,
    StudioImageCarousel,
    StudioInfoActions,
    StudioInfoSummary,
    StudioLocation,
} from '@/entities/studio';
import { FAVORITE_STUDIOS_QUERY_KEY } from '@/features/studio/favorite-list';
import { StudioReviewPreview } from '@/features/studio/reviews';
import { FavoriteToggleButton } from '@/features/studio/toggle-favorite/ui/FavoriteToggleButton';
import { ApiError } from '@/shared/api';
import { EmptyState } from '@/shared/ui';

import { usePublicStudioDetail, usePublicStudioPrograms } from '../queries';

export function StudioDetailClient() {
    const params = useParams<{ slug: string }>();
    const slug = params.slug;
    const router = useRouter();
    const queryClient = useQueryClient();

    const detailQuery = usePublicStudioDetail(slug);
    const programsQuery = usePublicStudioPrograms(slug);

    const store = detailQuery.data?.store;

    // 404 / 에러 (헤더 없는 풀블리드 화면이라 EmptyState 내 버튼으로 이탈).
    if (detailQuery.isError) {
        const is404 = detailQuery.error instanceof ApiError && detailQuery.error.statusCode === 404;
        return (
            <main className="flex min-h-full items-center justify-center px-6 py-20 text-center">
                <EmptyState
                    message={is404 ? '공방을 찾을 수 없어요.' : '정보를 불러오지 못했어요.'}
                >
                    <p className="text-sm text-foreground-secondary">
                        {is404
                            ? '삭제되거나 비공개 처리된 공방이에요.'
                            : '잠시 후 다시 시도해주세요.'}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (is404 ? router.back() : detailQuery.refetch())}
                    >
                        {is404 ? '돌아가기' : '다시 시도'}
                    </Button>
                </EmptyState>
            </main>
        );
    }

    if (detailQuery.isLoading || !store) {
        return <StudioDetailSkeleton />;
    }

    const programs = programsQuery.data?.programs ?? [];

    // 이미지 배열을 StudioImageCarousel이 요구하는 형태로 변환 (sortOrder 추가)
    const carouselImages = store.images.map((img, idx) => ({
        id: `img-${idx}`,
        imageUrl: img.imageUrl,
        isThumbnail: idx === 0,
        sortOrder: idx,
    }));

    const hasPrograms = programs.length > 0;

    return (
        <main className="min-h-full overflow-y-auto bg-background pb-20">
            <div className="relative">
                <StudioImageCarousel images={carouselImages} />
                <div className="absolute inset-x-0 top-0 z-10 pt-safe">
                    <div className="flex items-center justify-between p-2">
                        <Button
                            variant="overlay"
                            layout="onlyIcon"
                            size="sm"
                            icon={<LeftIcon />}
                            aria-label="뒤로가기"
                            onClick={() => router.back()}
                        />
                        <FavoriteToggleButton
                            storeId={store.id}
                            initialFavorite={store.isFavorite}
                            onAfterSuccess={() => {
                                // 공방 상세 토글 성공 → 찜 목록 쿼리 무효화 (재진입 시 목록 상태 동기화).
                                void queryClient.invalidateQueries({
                                    queryKey: FAVORITE_STUDIOS_QUERY_KEY,
                                });
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="relative -mt-6 flex flex-col rounded-t-2xl bg-background px-4">
                <SpaceBlock size={8} />
                <div className="py-2">
                    <StudioInfoSummary
                        name={store.name}
                        rating={store.rating ?? 0}
                        reviewCount={store.reviewCount}
                        description={store.description}
                        tags={<ConvenienceChips convenienceInfo={store.convenienceInfo} />}
                        actions={
                            <StudioInfoActions
                                phone={store.phone}
                                slug={store.slug}
                                storeName={store.name}
                            />
                        }
                    />
                </div>

                <StudioReviewPreview slug={store.slug} />

                <Divider />

                {/* 운영 클래스 */}
                <SectionTitle
                    title="운영 클래스"
                    size="lg"
                    subText={hasPrograms ? `${programs.length}개` : '준비 중'}
                />
                <section className="py-2">
                    {programsQuery.isLoading && (
                        <div className="space-y-2">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
                            ))}
                        </div>
                    )}
                    {!programsQuery.isLoading && !hasPrograms && (
                        <EmptyState message="아직 등록된 클래스가 없어요." />
                    )}
                    {!programsQuery.isLoading && hasPrograms && (
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
                                        href={`/classes/${program.id}?store=${encodeURIComponent(slug)}&storeName=${encodeURIComponent(store.name)}`}
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

                {/* 위치 */}
                <SectionTitle title="위치" size="lg" />
                <section className="py-2">
                    <StudioLocation
                        address={store.address}
                        latitude={store.location.lat}
                        longitude={store.location.lng}
                        name={store.name}
                    />
                </section>
            </div>
        </main>
    );
}
