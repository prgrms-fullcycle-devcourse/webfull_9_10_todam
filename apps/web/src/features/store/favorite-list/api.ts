import type { FavoriteStoreListResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/api/v1';

export type GetFavoriteStoresParams = {
    cursor?: string | null;
    limit?: number;
};

// 찜한 공방 목록 조회 (커서 페이지네이션).
// contract: docs/exec-plans/active/유저 마이 - 찜한 공방 목록 조회, 공방 찜 등록_해제.md
// GET /users/me/favorite-stores?cursor=&limit=
export function getFavoriteStores({ cursor, limit }: GetFavoriteStoresParams = {}) {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (typeof limit === 'number') params.set('limit', String(limit));
    const qs = params.toString();
    return clientApiFetch<FavoriteStoreListResult>(
        `${BASE}/users/me/favorite-stores${qs ? `?${qs}` : ''}`,
        { method: 'GET' },
    );
}
