export interface CreateStoreImageCommand {
    fileName: string;
    fileType: string;
    isThumbnail: boolean;
}

export interface CreateStoreImageResult {
    imageId: string;
    uploadUrl: string;
    imageUrl: string;
}

export interface CreateBusinessDocumentImageCommand {
    fileName: string;
    fileType: string;
}

export interface CreateBusinessDocumentImageResult {
    uploadUrl: string;
    documentUrl: string;
}

export interface ConfirmStoreImageResult {
    image: {
        id: string;
        status: string;
    };
}

export interface SubmitStoreResult {
    store: {
        id: string;
        status: string;
        updatedAt: string;
    };
}
