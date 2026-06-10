import type { StoreReviewListResult, StoreReviewSort } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

export type PublicStudioNameResult = {
    store: {
        name: string;
    };
};

export type GetStudioReviewsParams = {
    cursor?: string | null;
    limit?: number;
    sort?: StoreReviewSort;
};

export function getPublicStudioName(slug: string) {
    return clientApiFetch<PublicStudioNameResult>(`/stores/${encodeURIComponent(slug)}`, {
        method: 'GET',
    });
}

export function getStudioReviews(slug: string, params: GetStudioReviewsParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.cursor) searchParams.set('cursor', params.cursor);
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params.sort !== undefined) searchParams.set('sort', params.sort);
    const qs = searchParams.toString();

    return clientApiFetch<StoreReviewListResult>(
        `/stores/${encodeURIComponent(slug)}/reviews${qs ? `?${qs}` : ''}`,
        { method: 'GET' },
    );
}
