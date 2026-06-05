import { Injectable } from '@nestjs/common';
import { CreateStoreWriter, type CreateStoreInput } from '../../domain/repositories/store-writers';

@Injectable()
export class CreateStoreUseCase {
    constructor(private readonly writer: CreateStoreWriter) {}

    execute(userId: string, input: CreateStoreInput) {
        return this.writer.execute(userId, input);
    }
}
