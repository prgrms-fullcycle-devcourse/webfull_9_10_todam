import type { ToggleFavoriteResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

// 공방 찜 토글 (POST /stores/:storeId/favorite — body 없음).
// contract: docs/exec-plans/active/유저 마이 - 찜한 공방 목록 조회, 공방 찜 등록_해제.md
// 실 BE 연동: BE 글로벌 prefix 없음 → root 경로(/stores/:storeId/favorite). 목록(GET)도 실 BE 연동(PR #255 dev 머지) → root 경로(/users/me/favorite-stores) 동일 컨벤션.
export function toggleFavorite(storeId: string) {
    return clientApiFetch<ToggleFavoriteResult>(`/stores/${encodeURIComponent(storeId)}/favorite`, {
        method: 'POST',
    });
}
