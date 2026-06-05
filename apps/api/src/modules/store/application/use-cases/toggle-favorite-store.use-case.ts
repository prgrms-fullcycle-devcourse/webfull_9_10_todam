import { Injectable } from '@nestjs/common';
import { ToggleFavoriteStoreWriter } from '../../domain/repositories/store-writers';

@Injectable()
export class ToggleFavoriteStoreUseCase {
    constructor(private readonly writer: ToggleFavoriteStoreWriter) {}

    execute(userId: string, storeId: string) {
        return this.writer.execute(userId, storeId);
    }
}
