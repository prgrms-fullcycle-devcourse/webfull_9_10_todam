import type { ArtworkDetailResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/api/v1';

// 작품 상세 조회 (단건).
// contract: docs/exec-plans/active/유저 예약 - 작품 상세 조회.md
// GET /artworks/{artworkId}
export function getArtworkDetail(artworkId: string) {
    return clientApiFetch<ArtworkDetailResult>(`${BASE}/artworks/${artworkId}`, {
        method: 'GET',
    });
}
