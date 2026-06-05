import { Injectable } from '@nestjs/common';
import { StoreCommandRepository } from '../../domain/repositories/store-command.repository';
import type { CreateStoreDto } from '../../presentation/dto/create-store.dto';
import type { UpdateBusinessDocumentDto } from '../../presentation/dto/update-business-document.dto';
import type { UpdateStoreDto } from '../../presentation/dto/update-store.dto';
import { PrismaCreateStoreCommand } from './prisma-create-store.command';
import { PrismaToggleFavoriteStoreCommand } from './prisma-toggle-favorite-store.command';
import { PrismaUpdateBusinessDocumentCommand } from './prisma-update-business-document.command';
import { PrismaUpdateStoreCommand } from './prisma-update-store.command';

@Injectable()
export class PrismaStoreCommandRepository extends StoreCommandRepository {
    constructor(
        private readonly createCommand: PrismaCreateStoreCommand,
        private readonly updateCommand: PrismaUpdateStoreCommand,
        private readonly updateBusinessDocumentCommand: PrismaUpdateBusinessDocumentCommand,
        private readonly toggleFavoriteCommand: PrismaToggleFavoriteStoreCommand,
    ) {
        super();
    }

    create(userId: string, dto: CreateStoreDto) {
        return this.createCommand.execute(userId, dto);
    }

    update(userId: string, storeId: string, dto: UpdateStoreDto) {
        return this.updateCommand.execute(userId, storeId, dto);
    }

    updateBusinessDocument(userId: string, storeId: string, dto: UpdateBusinessDocumentDto) {
        return this.updateBusinessDocumentCommand.execute(userId, storeId, dto);
    }

    toggleFavorite(userId: string, storeId: string) {
        return this.toggleFavoriteCommand.execute(userId, storeId);
    }
}
