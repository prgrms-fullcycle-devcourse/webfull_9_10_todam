import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateStoreUseCase } from './application/use-cases/create-store.use-case';
import { CreateStoreImageUseCase } from './application/use-cases/create-store-image.use-case';
import { ConfirmStoreImageUseCase } from './application/use-cases/confirm-store-image.use-case';
import { SubmitStoreUseCase } from './application/use-cases/submit-store.use-case';
import { ListPartnerStoresUseCase } from './application/use-cases/list-partner-stores.use-case';
import { GetPartnerStoreDetailUseCase } from './application/use-cases/get-partner-store-detail.use-case';
import { ListPartnerStoreProgramsUseCase } from './application/use-cases/list-partner-store-programs.use-case';
import { UpdateStoreUseCase } from './application/use-cases/update-store.use-case';
import { DeleteStoreImageUseCase } from './application/use-cases/delete-store-image.use-case';
import { ListStoresUseCase } from './application/use-cases/list-stores.use-case';
import { PartnerGuard } from '../../common/guards/partner.guard';
import { StoreController } from './presentation/controllers/store.controller';

@Module({
    imports: [AuthModule],
    controllers: [StoreController],
    providers: [
        CreateStoreUseCase,
        CreateStoreImageUseCase,
        ConfirmStoreImageUseCase,
        SubmitStoreUseCase,
        ListPartnerStoresUseCase,
        GetPartnerStoreDetailUseCase,
        ListPartnerStoreProgramsUseCase,
        UpdateStoreUseCase,
        DeleteStoreImageUseCase,
        ListStoresUseCase,
        PartnerGuard,
    ],
})
export class StoreModule {}
