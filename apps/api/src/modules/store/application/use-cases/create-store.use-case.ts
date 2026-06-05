import { Injectable } from '@nestjs/common';
import { StoreCommandRepository } from '../../domain/repositories/store-command.repository';
import type { CreateStoreDto } from '../../presentation/dto/create-store.dto';

@Injectable()
export class CreateStoreUseCase {
    constructor(private readonly commands: StoreCommandRepository) {}

    execute(userId: string, dto: CreateStoreDto) {
        return this.commands.create(userId, dto);
    }
}
