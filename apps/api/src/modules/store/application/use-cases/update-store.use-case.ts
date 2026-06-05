import { Injectable } from '@nestjs/common';
import { UpdateStoreWriter, type UpdateStoreInput } from '../../domain/repositories/store-writers';

@Injectable()
export class UpdateStoreUseCase {
    constructor(private readonly writer: UpdateStoreWriter) {}

    execute(userId: string, storeId: string, input: UpdateStoreInput) {
        return this.writer.execute(userId, storeId, input);
    }
}
