import { Injectable } from '@nestjs/common';
import { StoreCommandRepository } from '../../domain/repositories/store-command.repository';

@Injectable()
export class ToggleFavoriteStoreUseCase {
    constructor(private readonly commands: StoreCommandRepository) {}

    execute(userId: string, storeId: string) {
        return this.commands.toggleFavorite(userId, storeId);
    }
}
