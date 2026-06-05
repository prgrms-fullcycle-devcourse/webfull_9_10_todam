import { Injectable } from '@nestjs/common';
import { StoreCommandRepository } from '../../domain/repositories/store-command.repository';
import type { UpdateStoreDto } from '../../presentation/dto/update-store.dto';

@Injectable()
export class UpdateStoreUseCase {
    constructor(private readonly commands: StoreCommandRepository) {}

    execute(userId: string, storeId: string, dto: UpdateStoreDto) {
        return this.commands.update(userId, storeId, dto);
    }
}
