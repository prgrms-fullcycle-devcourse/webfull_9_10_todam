export type StoreImageStatus = 'PENDING' | 'UPLOADED' | 'FAILED';

export interface StoreImage {
    id: string;
    imageUrl: string;
    thumbnailUrl: string | null;
    status: StoreImageStatus;
}

export interface CreatePendingStoreImageInput {
    storeId: string;
    imageUrl: string;
    isThumbnail: boolean;
}

export abstract class StoreImageRepository {
    abstract countByStore(storeId: string): Promise<number>;
    abstract createPending(input: CreatePendingStoreImageInput): Promise<{ id: string }>;
    abstract findByStoreAndId(storeId: string, imageId: string): Promise<StoreImage | null>;
    abstract markUploaded(imageId: string): Promise<{ id: string; status: StoreImageStatus }>;
    abstract delete(imageId: string): Promise<void>;
}
