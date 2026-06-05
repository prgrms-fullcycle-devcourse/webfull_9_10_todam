import { Injectable } from '@nestjs/common';
import {
    UpdateBusinessDocumentWriter,
    type UpdateBusinessDocumentInput,
} from '../../domain/repositories/store-writers';

@Injectable()
export class UpdateBusinessDocumentUseCase {
    constructor(private readonly writer: UpdateBusinessDocumentWriter) {}

    execute(userId: string, storeId: string, input: UpdateBusinessDocumentInput) {
        return this.writer.execute(userId, storeId, input);
    }
}
