import type {
    CreateStoreDto,
    CreateStoreResponseDto,
} from '../../presentation/dto/create-store.dto';
import type { ToggleFavoriteStoreResponseDto } from '../../presentation/dto/toggle-favorite-store.dto';
import type {
    UpdateBusinessDocumentDto,
    UpdateBusinessDocumentResponseDto,
} from '../../presentation/dto/update-business-document.dto';
import type {
    UpdateStoreDto,
    UpdateStoreResponseDto,
} from '../../presentation/dto/update-store.dto';

export abstract class StoreCommandRepository {
    abstract create(userId: string, dto: CreateStoreDto): Promise<CreateStoreResponseDto>;
    abstract update(
        userId: string,
        storeId: string,
        dto: UpdateStoreDto,
    ): Promise<UpdateStoreResponseDto>;
    abstract updateBusinessDocument(
        userId: string,
        storeId: string,
        dto: UpdateBusinessDocumentDto,
    ): Promise<UpdateBusinessDocumentResponseDto>;
    abstract toggleFavorite(
        userId: string,
        storeId: string,
    ): Promise<ToggleFavoriteStoreResponseDto>;
}
