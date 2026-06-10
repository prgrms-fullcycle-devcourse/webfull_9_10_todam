import type { ArtworkDetailResult } from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

// BE global prefix 없음. 실 경로 = /artworks/:artworkId.
// contract: docs/exec-plans/active/유저 예약 - 작품 상세 조회.md
// GET /artworks/{artworkId}
export function getArtworkDetail(artworkId: string) {
    return clientApiFetch<ArtworkDetailResult>(`/artworks/${artworkId}`, {
        method: 'GET',
    });
}
