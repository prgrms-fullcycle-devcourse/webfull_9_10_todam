export interface ConvenienceInfoInput {
    parking: boolean;
    pet: boolean;
    wifi: boolean;
}

export interface OperatingHourInput {
    dayOfWeek: string;
    openTime: string;
    closeTime: string;
    breakStart?: string | null;
    breakEnd?: string | null;
}

export interface CreateStoreInput {
    name: string;
    slug?: string;
    description?: string | null;
    phone: string;
    address: string;
    latitude: number;
    longitude: number;
    convenienceInfo: ConvenienceInfoInput;
    autoConfirm: boolean;
    cancelDeadlineDays: number;
    reservationIntervalMinutes: number;
    maxCapacityPerSlot: number;
    operatingHours: OperatingHourInput[];
    businessDocument: {
        businessNumber: string;
        businessName: string;
        ownerName: string;
        businessAddress: string;
        email?: string;
        documentUrl?: string | null;
    };
}

export interface UpdateStoreInput {
    name?: string;
    slug?: string;
    description?: string | null;
    phone?: string;
    convenienceInfo?: ConvenienceInfoInput;
    autoConfirm?: boolean;
    cancelDeadlineDays?: number;
    reservationIntervalMinutes?: number;
    maxCapacityPerSlot?: number;
    operatingHours?: OperatingHourInput[];
    images?: string[];
}

export interface UpdateBusinessDocumentInput {
    businessNumber?: string;
    businessName?: string;
    ownerName?: string;
    businessAddress?: string;
    email?: string;
    documentUrl?: string | null;
}

export interface CreateStoreResult {
    store: {
        id: string;
        partnerId: string;
        name: string;
        slug: string;
        status: string;
        createdAt: string;
    };
}

export interface UpdateStoreResult {
    store: { id: string; name: string; slug: string; status: string; updatedAt: string };
}

export interface UpdateBusinessDocumentResult {
    store: { id: string; status: string; updatedAt: string };
}

export interface ToggleFavoriteResult {
    storeId: string;
    isFavorite: boolean;
}

export abstract class CreateStoreWriter {
    abstract execute(userId: string, input: CreateStoreInput): Promise<CreateStoreResult>;
}

export abstract class UpdateStoreWriter {
    abstract execute(
        userId: string,
        storeId: string,
        input: UpdateStoreInput,
    ): Promise<UpdateStoreResult>;
}

export abstract class UpdateBusinessDocumentWriter {
    abstract execute(
        userId: string,
        storeId: string,
        input: UpdateBusinessDocumentInput,
    ): Promise<UpdateBusinessDocumentResult>;
}

export abstract class ToggleFavoriteStoreWriter {
    abstract execute(userId: string, storeId: string): Promise<ToggleFavoriteResult>;
}
