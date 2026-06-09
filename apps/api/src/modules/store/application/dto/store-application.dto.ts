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

// SubmitStoreResult 는 @todam/shared(submitStoreResultSchema) 가 SSOT.
// use-case 에서 직접 import 한다.
