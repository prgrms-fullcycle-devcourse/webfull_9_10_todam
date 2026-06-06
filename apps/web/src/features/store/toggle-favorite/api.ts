import type { ToggleFavoriteResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

// 공방 찜 토글 (POST /stores/:storeId/favorite — body 없음).
// contract: docs/exec-plans/active/유저 마이 - 찜한 공방 목록 조회, 공방 찜 등록_해제.md
// 실 BE 연동: BE 글로벌 prefix 없음 → /api/v1 미부착(root 경로). 목록(GET)은 BE 미구현이라 mock(/api/v1) 유지.
export function toggleFavorite(storeId: string) {
    return clientApiFetch<ToggleFavoriteResult>(`/stores/${encodeURIComponent(storeId)}/favorite`, {
        method: 'POST',
    });
}
