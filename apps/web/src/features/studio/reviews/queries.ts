'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { StoreReviewSort } from '@todam/shared';
import { STORE_REVIEWS_PAGE_SIZE } from '@todam/shared';

import { ApiError } from '@/shared/api';

import { getPublicStudioName, getStudioReviews } from './api';

const STORE_REVIEW_SORT_DEFAULT: StoreReviewSort = 'latest';

const publicStudioKey = (slug: string) => ['public', 'studios', slug] as const;
const storeReviewsKey = (slug: string, sort: StoreReviewSort, limit: number) =>
    [...publicStudioKey(slug), 'reviews', { sort, limit }] as const;

function retryExceptNotFound(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) return false;
    return failureCount < 1;
}

export function usePublicStudioName(slug: string) {
    return useQuery({
        queryKey: publicStudioKey(slug),
        queryFn: () => getPublicStudioName(slug),
        enabled: Boolean(slug),
        retry: retryExceptNotFound,
        staleTime: 60_000,
    });
}

// 미리보기(파트너 공방 상세 등): 단일 페이지만 조회. 무한스크롤 불필요.
export function useStudioReviewsPreview(
    slug: string,
    sort: StoreReviewSort = 'rating_high',
    limit = STORE_REVIEWS_PAGE_SIZE,
) {
    return useQuery({
        queryKey: [...storeReviewsKey(slug, sort, limit), 'preview'] as const,
        queryFn: () => getStudioReviews(slug, { limit, sort }),
        enabled: Boolean(slug),
        retry: retryExceptNotFound,
        staleTime: 30_000,
    });
}

export function useStudioReviewsInfinite(
    slug: string,
    sort: StoreReviewSort = STORE_REVIEW_SORT_DEFAULT,
    limit = STORE_REVIEWS_PAGE_SIZE,
) {
    return useInfiniteQuery({
        queryKey: storeReviewsKey(slug, sort, limit),
        queryFn: ({ pageParam }) =>
            getStudioReviews(slug, {
                cursor: pageParam,
                limit,
                sort,
            }),
        enabled: Boolean(slug),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) =>
            lastPage.pageInfo.hasNext ? (lastPage.pageInfo.nextCursor ?? undefined) : undefined,
        retry: retryExceptNotFound,
        staleTime: 30_000,
    });
}
