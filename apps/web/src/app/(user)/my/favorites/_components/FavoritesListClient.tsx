'use client';

import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { FavoriteStoreItem, FavoriteStoreListResult } from '@todam/shared';
import { Button, HeartFillIcon } from '@todam/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { FavoriteStoreCard } from '../../../../../entities/store';
import {
    FAVORITE_STORES_QUERY_KEY,
    useFavoriteStores,
} from '../../../../../features/store/favorite-list';
import { useToggleFavorite } from '../../../../../features/store/toggle-favorite';
import { ApiError } from '../../../../../shared/api';
import { useToast } from '../../../../../shared/model';
import { EmptyState } from '../../../../../shared/ui';

type FavoriteInfiniteData = InfiniteData<FavoriteStoreListResult, string | null>;

// 클라이언트 동작(react-query / IntersectionObserver / 401 리다이렉트 / 낙관적 해제) 캡슐화.
// page.tsx 는 서버 컴포넌트로 두고 본 클라이언트 컴포넌트만 렌더.
export function FavoritesListClient() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { push } = useToast();
    const toggle = useToggleFavorite();

    const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
        useFavoriteStores();

    // 401 → 로그인 페이지로. (공통 401 인터셉터 없음 → 화면별 처리)
    useEffect(() => {
        if (isError && error instanceof ApiError && error.statusCode === 401) {
            router.replace('/login');
        }
    }, [isError, error, router]);

    // 무한 스크롤: 리스트 하단 sentinel 진입 시 다음 페이지 요청.
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        if (!hasNextPage || isFetchingNextPage) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    void fetchNextPage();
                }
            },
            { rootMargin: '120px 0px 0px 0px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const queryKey = [...FAVORITE_STORES_QUERY_KEY, { limit: undefined }] as const;

    // 무한쿼리 캐시에서 항목 제거/복원 (낙관적 업데이트 — D3).
    function removeFromCache(favoriteId: string) {
        queryClient.setQueryData<FavoriteInfiniteData>(queryKey, (prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                pages: prev.pages.map((page) => ({
                    ...page,
                    favoriteStores: page.favoriteStores.filter((s) => s.favoriteId !== favoriteId),
                })),
            };
        });
    }

    function restoreToCache(item: FavoriteStoreItem) {
        queryClient.setQueryData<FavoriteInfiniteData>(queryKey, (prev) => {
            if (!prev || prev.pages.length === 0) return prev;
            // 첫 페이지 선두에 복원 후 최신 찜순(createdAt 내림차순) 재정렬.
            const [first, ...restPages] = prev.pages;
            const merged = [item, ...first!.favoriteStores].sort((a, b) =>
                b.createdAt.localeCompare(a.createdAt),
            );
            return {
                ...prev,
                pages: [{ ...first!, favoriteStores: merged }, ...restPages],
            };
        });
    }

    // 찜 해제: 즉시 목록 제거 → 성공 시 완료 토스트 → 실패 시 복원 + 에러 토스트 (D3).
    function handleUnfavorite(item: FavoriteStoreItem) {
        removeFromCache(item.favoriteId);
        toggle.mutate(
            { storeId: item.storeId },
            {
                onSuccess: () => {
                    push({
                        type: 'icon',
                        message: `'${item.name}' 찜 해제되었어요`,
                    });
                },
                onError: (err) => {
                    if (err instanceof ApiError && err.statusCode === 401) {
                        router.replace('/login');
                        return;
                    }
                    restoreToCache(item);
                    push({
                        type: 'icon',
                        message: '찜 상태 변경에 실패했습니다.',
                    });
                },
            },
        );
    }

    const items = data?.pages.flatMap((p) => p.favoriteStores) ?? [];
    const isEmpty = !isLoading && !isError && items.length === 0;
    // 401 은 로그인 리다이렉트 → 화면 메시지 분기 제외.
    const isNetworkError = isError && !(error instanceof ApiError && error.statusCode === 401);

    return (
        <main className="flex-1 overflow-y-auto px-4 pb-16">
            {isLoading && (
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    찜한 공방을 불러오는 중입니다.
                </p>
            )}

            {isNetworkError && (
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    찜한 공방을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </p>
            )}

            {/* D5: 빈 상태 Figma 미확보 → 임시 placeholder(공용 EmptyState). 디자인 확정 시 교체. */}
            {isEmpty && <EmptyState message="아직 찜한 공방이 없어요." />}

            {items.length > 0 && (
                <section className="flex flex-col gap-4 py-2">
                    {items.map((item) => (
                        <FavoriteStoreCard
                            key={item.favoriteId}
                            storeId={item.storeId}
                            name={item.name}
                            category={item.category}
                            imageUrl={item.imageUrl}
                            address={item.address}
                            action={
                                // 목록 내 항목은 항상 찜됨(채워진 하트) → 탭 시 해제.
                                // FavoriteToggleButton 은 자체 mutation 을 소유하므로 목록(제거+토스트)
                                // 흐름과 이중 발화하지 않도록 전용 버튼으로 handleUnfavorite 단일 호출.
                                <Button
                                    variant="overlay"
                                    layout="onlyIcon"
                                    size="sm"
                                    icon={<HeartFillIcon />}
                                    aria-label="찜 해제"
                                    disabled={toggle.isPending}
                                    onClick={() => handleUnfavorite(item)}
                                    className="shrink-0"
                                />
                            }
                        />
                    ))}
                    <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
                    {isFetchingNextPage && (
                        <p className="py-3 text-center text-xs text-foreground-tertiary">
                            불러오는 중입니다.
                        </p>
                    )}
                </section>
            )}
        </main>
    );
}
