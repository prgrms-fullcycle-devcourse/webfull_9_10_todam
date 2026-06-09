import type { StoreDetailResult, PublicProgramListResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

// 공방 상세 조회 (퍼블릭, OptionalAuth)
// contract: docs/exec-plans/active/user-공방-상세.md § Contract A
export function getPublicStoreDetail(slug: string) {
    return clientApiFetch<StoreDetailResult>(`/stores/${encodeURIComponent(slug)}`, {
        method: 'GET',
    });
}

// 퍼블릭 운영 클래스 목록 조회
// contract: docs/exec-plans/active/user-공방-상세.md § Contract B
export function getPublicStorePrograms(slug: string) {
    return clientApiFetch<PublicProgramListResult>(`/stores/${encodeURIComponent(slug)}/programs`, {
        method: 'GET',
    });
}
