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
}
