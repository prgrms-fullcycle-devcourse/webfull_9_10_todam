import { Injectable } from '@nestjs/common';
import { StoreCommandRepository } from '../../domain/repositories/store-command.repository';
import type { UpdateBusinessDocumentDto } from '../../presentation/dto/update-business-document.dto';

@Injectable()
export class UpdateBusinessDocumentUseCase {
    constructor(private readonly commands: StoreCommandRepository) {}

    execute(userId: string, storeId: string, dto: UpdateBusinessDocumentDto) {
        return this.commands.updateBusinessDocument(userId, storeId, dto);
    }
}
