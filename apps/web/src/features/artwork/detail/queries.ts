'use client';

import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';

import { getArtworkDetail } from './api';

const KEY = ['artworks', 'detail'] as const;

export function useArtworkDetail(artworkId: string) {
    return useQuery({
        queryKey: [...KEY, artworkId] as const,
        queryFn: () => getArtworkDetail(artworkId),
        staleTime: 30_000,
        // 401/403/404 는 사용자 시점에 변하지 않으므로 retry 비활성.
        retry: (failureCount, error) => {
            if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) {
                return false;
            }
            return failureCount < 2;
        },
        enabled: Boolean(artworkId),
    });
}
