import type {
    ListPartnerArtworksResult,
    CountPartnerArtworksResult,
    ArtworkStatusGroup,
    ArtworkDetailStatus,
} from '@todam/shared';
import { ArtworkStatus } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/partner';

export type GetPartnerArtworksParams = {
    storeId: string;
    group?: ArtworkStatusGroup;
    detailStatus?: ArtworkDetailStatus;
    status?: ArtworkStatus;
    cursor?: string | null;
    limit?: number;
};

// 공방 작품 목록 조회 (커서 페이지네이션).
// GET /partner/stores/{storeId}/artworks?group=&detailStatus=&status=&cursor=&limit=
export function getPartnerArtworks({
    storeId,
    group,
    detailStatus,
    status,
    cursor,
    limit,
}: GetPartnerArtworksParams) {
    const params = new URLSearchParams();
    if (group) params.set('group', group);
    if (detailStatus) params.set('detailStatus', detailStatus);
    if (status) params.set('status', status);
    if (cursor) params.set('cursor', cursor);
    if (typeof limit === 'number') params.set('limit', String(limit));
    const qs = params.toString();
    return clientApiFetch<ListPartnerArtworksResult>(
        `${BASE}/stores/${storeId}/artworks${qs ? `?${qs}` : ''}`,
        { method: 'GET' },
    );
}

export type GetPartnerArtworkCountParams = {
    storeId: string;
    group?: ArtworkStatusGroup;
};

// 공방 작품 단계별 개수 조회.
// contract: docs/exec-plans/active/partner-artwork-management.md
// GET /partner/artworks/count-by-step?storeId=&group=
export function getPartnerArtworkCount({ storeId, group }: GetPartnerArtworkCountParams) {
    const params = new URLSearchParams();
    params.set('storeId', storeId);
    if (group) params.set('group', group);
    return clientApiFetch<CountPartnerArtworksResult>(
        `${BASE}/artworks/count-by-step?${params.toString()}`,
        { method: 'GET' },
    );
}
