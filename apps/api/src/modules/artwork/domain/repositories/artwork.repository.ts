import type {
    BulkUpdateArtworkStatusRequest,
    BulkUpdateArtworkStatusResult,
    ConfirmArtworkPhotoResult,
    CountPartnerArtworksQuery,
    CountPartnerArtworksResult,
    CreateArtworkPhotosRequest,
    CreateArtworkPhotosResult,
    DeleteArtworkPhotoResult,
    GetPartnerArtworkDetailResult,
    ListPartnerArtworksQuery,
    ListPartnerArtworksResult,
    UpdateArtworkDeliveryInfoRequest,
    UpdateArtworkDeliveryInfoResult,
    UpdateArtworkDeliveryRequest,
    UpdateArtworkDeliveryResult,
    UpdateArtworkStatusRequest,
    UpdateArtworkStatusResult,
} from '@todam/shared';
import type { ArtworkStatus, ImageUploadStatus } from '@prisma/client';

// 유저용 작품 상세 조회 row 타입 (repository → use-case 경계).
export interface UserArtworkDetailRow {
    id: string;
    status: ArtworkStatus;
    estimatedCompletedAt: Date | null;
    reservation: {
        userId: string | null;
    };
    logs: Array<{
        id: string;
        toStatus: ArtworkStatus;
        createdAt: Date;
        photos: Array<{
            id: string;
            imageUrl: string;
            thumbnailUrl: string | null;
            status: ImageUploadStatus;
        }>;
    }>;
}

export abstract class ArtworkRepository {
    abstract list(
        userId: string,
        storeId: string,
        query: ListPartnerArtworksQuery,
    ): Promise<ListPartnerArtworksResult>;
    abstract count(
        userId: string,
        query: CountPartnerArtworksQuery,
    ): Promise<CountPartnerArtworksResult>;
    abstract detail(userId: string, artworkId: string): Promise<GetPartnerArtworkDetailResult>;
    abstract updateStatus(
        userId: string,
        artworkId: string,
        dto: UpdateArtworkStatusRequest,
    ): Promise<UpdateArtworkStatusResult>;
    abstract bulkUpdateStatus(
        userId: string,
        dto: BulkUpdateArtworkStatusRequest,
    ): Promise<BulkUpdateArtworkStatusResult>;
    abstract createPhotos(
        userId: string,
        artworkId: string,
        dto: CreateArtworkPhotosRequest,
    ): Promise<CreateArtworkPhotosResult>;
    abstract confirmPhoto(
        userId: string,
        artworkId: string,
        photoId: string,
    ): Promise<ConfirmArtworkPhotoResult>;
    abstract deletePhoto(
        userId: string,
        artworkId: string,
        photoId: string,
    ): Promise<DeleteArtworkPhotoResult>;
    abstract updateDeliveryInfo(
        userId: string,
        artworkId: string,
        dto: UpdateArtworkDeliveryInfoRequest,
    ): Promise<UpdateArtworkDeliveryInfoResult>;
    abstract updateDelivery(
        userId: string,
        artworkId: string,
        dto: UpdateArtworkDeliveryRequest,
    ): Promise<UpdateArtworkDeliveryResult>;

    // 유저용 — 본인 가드(reservation.userId)와 타임라인 합성에 필요한 데이터 반환.
    abstract findUserArtworkDetail(artworkId: string): Promise<UserArtworkDetailRow | null>;
}
