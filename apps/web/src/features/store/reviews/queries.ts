'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { StoreReviewSort } from '@todam/shared';
import { STORE_REVIEWS_PAGE_SIZE } from '@todam/shared';

import { ApiError } from '@/shared/api';

import { getPublicStoreName, getStoreReviews } from './api';

const STORE_REVIEW_SORT_DEFAULT: StoreReviewSort = 'latest';

const publicStoreKey = (slug: string) => ['public', 'stores', slug] as const;
const storeReviewsKey = (slug: string, sort: StoreReviewSort, limit: number) =>
    [...publicStoreKey(slug), 'reviews', { sort, limit }] as const;

function retryExceptNotFound(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) return false;
    return failureCount < 1;
}

export function usePublicStoreName(slug: string) {
    return useQuery({
        queryKey: publicStoreKey(slug),
        queryFn: () => getPublicStoreName(slug),
        enabled: Boolean(slug),
        retry: retryExceptNotFound,
        staleTime: 60_000,
    });
}

export function useStoreReviewsInfinite(
    slug: string,
    sort: StoreReviewSort = STORE_REVIEW_SORT_DEFAULT,
    limit = STORE_REVIEWS_PAGE_SIZE,
) {
    return useInfiniteQuery({
        queryKey: storeReviewsKey(slug, sort, limit),
        queryFn: ({ pageParam }) =>
            getStoreReviews(slug, {
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
