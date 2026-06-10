import type { FavoriteStoreListResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

export type GetFavoriteStudiosParams = {
    cursor?: string | null;
    limit?: number;
};

// 찜한 공방 목록 조회 (커서 페이지네이션).
// contract: docs/exec-plans/active/유저 마이 - 찜한 공방 목록 조회, 공방 찜 등록_해제.md
// 실 BE 연동: BE 글로벌 prefix 없음 → root 경로(/users/me/favorite-stores). 토글(POST)과 동일 컨벤션.
// GET /users/me/favorite-stores?cursor=&limit=
export function getFavoriteStudios({ cursor, limit }: GetFavoriteStudiosParams = {}) {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (typeof limit === 'number') params.set('limit', String(limit));
    const qs = params.toString();
    return clientApiFetch<FavoriteStoreListResult>(
        `/users/me/favorite-stores${qs ? `?${qs}` : ''}`,
        { method: 'GET' },
    );
}
