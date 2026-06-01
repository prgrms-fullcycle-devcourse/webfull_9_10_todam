import type { ToggleLikeResult } from '@todam/shared';

import { apiFetch } from '../../../shared/api';

export function toggleLike(storeId: string, liked: boolean) {
    return apiFetch<ToggleLikeResult>(`/api/v1/stores/${encodeURIComponent(storeId)}/like`, {
        method: 'POST',
        body: { liked },
    });
}
