import type { ToggleFavoriteResult } from '@todam/shared';

import { apiFetch } from '@/shared/api';

// 공방 찜 토글 (POST /stores/:storeId/favorite — body 없음).
// contract: docs/exec-plans/active/유저 마이 - 찜한 공방 목록 조회, 공방 찜 등록_해제.md
export function toggleFavorite(storeId: string) {
    return apiFetch<ToggleFavoriteResult>(
        `/api/v1/stores/${encodeURIComponent(storeId)}/favorite`,
        { method: 'POST' },
    );
}
