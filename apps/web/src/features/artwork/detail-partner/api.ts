import type {
    GetPartnerArtworkDetailResult,
    UpdateArtworkStatusResult,
    CreateArtworkPhotosResult,
    ConfirmArtworkPhotoResult,
    DeleteArtworkPhotoResult,
    UpdateArtworkDeliveryResult,
    UpdateArtworkStatusRequest,
    CreateArtworkPhotosRequest,
    UpdateArtworkDeliveryRequest,
} from '@todam/shared';

import { clientApiFetch } from '@/shared/api';

const BASE = '/partner';

// 파트너 작품 상세 조회.
// GET /partner/artworks/{artworkId}
export function getPartnerArtworkDetail(artworkId: string) {
    return clientApiFetch<GetPartnerArtworkDetailResult>(`${BASE}/artworks/${artworkId}`, {
        method: 'GET',
    });
}

// 작품 상태 변경.
// PATCH /partner/artworks/{artworkId}/status
export function updateArtworkStatus(artworkId: string, body: UpdateArtworkStatusRequest) {
    return clientApiFetch<UpdateArtworkStatusResult>(`${BASE}/artworks/${artworkId}/status`, {
        method: 'PATCH',
        body,
    });
}

// 작품 사진 presigned URL 발급.
// POST /partner/artworks/{artworkId}/photos
export function createArtworkPhotos(artworkId: string, body: CreateArtworkPhotosRequest) {
    return clientApiFetch<CreateArtworkPhotosResult>(`${BASE}/artworks/${artworkId}/photos`, {
        method: 'POST',
        body,
    });
}

// 작품 사진 업로드 확정.
// POST /partner/artworks/{artworkId}/photos/{photoId}/confirm
export function confirmArtworkPhoto(artworkId: string, photoId: string) {
    return clientApiFetch<ConfirmArtworkPhotoResult>(
        `${BASE}/artworks/${artworkId}/photos/${photoId}/confirm`,
        { method: 'POST' },
    );
}

// 작품 사진 삭제.
// DELETE /partner/artworks/{artworkId}/photos/{photoId}
export function deleteArtworkPhoto(artworkId: string, photoId: string) {
    return clientApiFetch<DeleteArtworkPhotoResult>(
        `${BASE}/artworks/${artworkId}/photos/${photoId}`,
        { method: 'DELETE' },
    );
}

// 배송/픽업 처리.
// PATCH /partner/artworks/{artworkId}/delivery
export function updateArtworkDelivery(artworkId: string, body: UpdateArtworkDeliveryRequest) {
    return clientApiFetch<UpdateArtworkDeliveryResult>(`${BASE}/artworks/${artworkId}/delivery`, {
        method: 'PATCH',
        body,
    });
}
