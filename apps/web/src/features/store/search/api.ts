import type { AutocompleteResult, StoreListResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

// 경로는 prefix 없이(`/stores`) — `/api/v1`/proxy/실BE 매핑은 resolveUrl + BASE_URL이 처리.
// (entities/program 등 다른 피처와 동일 컨벤션. MSW·실 BE 양쪽 정상.)

// 성수동 기본 좌표 — 위치 권한 거부 시 폴백 (plan decision #6)
export const DEFAULT_LAT = 37.5446;
export const DEFAULT_LNG = 127.056;

export type GetStoresParams = {
    lat?: number;
    lng?: number;
    keyword?: string;
    cursor?: string | null;
    limit?: number;
};

// GET /stores — keyword 포함 공방 검색 결과
// contract: docs/exec-plans/active/user-stores-keyword.md API Contract A
export function getStores({ lat, lng, keyword, cursor, limit }: GetStoresParams = {}) {
    const params = new URLSearchParams();
    if (typeof lat === 'number') params.set('lat', String(lat));
    if (typeof lng === 'number') params.set('lng', String(lng));
    if (keyword) params.set('keyword', keyword);
    if (cursor) params.set('cursor', cursor);
    if (typeof limit === 'number') params.set('limit', String(limit));
    const qs = params.toString();
    return clientApiFetch<StoreListResult>(`/stores${qs ? `?${qs}` : ''}`, {
        method: 'GET',
    });
}

export type GetAutocompleteParams = {
    keyword: string;
};

// GET /stores/search/autocomplete — 자동완성
// contract: docs/exec-plans/active/user-stores-keyword.md API Contract B
// keyword 필수 (공백 불가). 빈 keyword 전달 시 400 KEYWORD_REQUIRED.
export function getAutocomplete({ keyword }: GetAutocompleteParams) {
    const params = new URLSearchParams({ keyword });
    return clientApiFetch<AutocompleteResult>(`/stores/search/autocomplete?${params.toString()}`, {
        method: 'GET',
    });
}
