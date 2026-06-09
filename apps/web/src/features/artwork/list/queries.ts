'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
    DEFAULT_PAGE_SIZE,
    type ArtworkStatusGroup,
    type ArtworkDetailStatus,
} from '@todam/shared';
import { ArtworkStatus } from '@todam/shared';

import { getPartnerArtworks, getPartnerArtworkCount } from './api';

const KEY = ['artworks', 'partner'] as const;

export type UsePartnerArtworksParams = {
    storeId: string;
    group?: ArtworkStatusGroup;
    detailStatus?: ArtworkDetailStatus;
    status?: ArtworkStatus;
    limit?: number;
};

// 무한 스크롤용 hook. cursor=null → 첫 페이지, 이후 응답의 nextCursor 가 다음 페이지 키.
export function usePartnerArtworks({
    storeId,
    group,
    detailStatus,
    status,
    limit,
}: UsePartnerArtworksParams) {
    return useInfiniteQuery({
        queryKey: [...KEY, 'list', { storeId, group, detailStatus, status, limit }] as const,
        queryFn: ({ pageParam }) =>
            getPartnerArtworks({
                storeId,
                group,
                detailStatus,
                status,
                limit: limit ?? DEFAULT_PAGE_SIZE,
                cursor: pageParam,
            }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
        enabled: Boolean(storeId),
    });
}

export type UsePartnerArtworkCountParams = {
    storeId: string;
    group?: ArtworkStatusGroup;
};

export function usePartnerArtworkCount({ storeId, group }: UsePartnerArtworkCountParams) {
    return useQuery({
        queryKey: [...KEY, 'count', { storeId, group }] as const,
        queryFn: () => getPartnerArtworkCount({ storeId, group }),
        enabled: Boolean(storeId),
    });
}
