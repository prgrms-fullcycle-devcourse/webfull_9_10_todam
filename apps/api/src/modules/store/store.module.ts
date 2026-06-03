import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateStoreUseCase } from './application/use-cases/create-store.use-case';
import { CreateStoreImageUseCase } from './application/use-cases/create-store-image.use-case';
import { CreateBusinessDocumentImageUseCase } from './application/use-cases/create-business-document-image.use-case';
import { ConfirmStoreImageUseCase } from './application/use-cases/confirm-store-image.use-case';
import { SubmitStoreUseCase } from './application/use-cases/submit-store.use-case';
import { ListPartnerStoresUseCase } from './application/use-cases/list-partner-stores.use-case';
import { GetPartnerStoreDetailUseCase } from './application/use-cases/get-partner-store-detail.use-case';
import { GetPartnerOnboardingUseCase } from './application/use-cases/get-partner-onboarding.use-case';
import { ListPartnerStoreProgramsUseCase } from './application/use-cases/list-partner-store-programs.use-case';
import { UpdateStoreUseCase } from './application/use-cases/update-store.use-case';
import { UpdateBusinessDocumentUseCase } from './application/use-cases/update-business-document.use-case';
import { DeleteStoreImageUseCase } from './application/use-cases/delete-store-image.use-case';
import { PartnerGuard } from '../../common/guards/partner.guard';
import { StoreController } from './presentation/controllers/store.controller';

@Module({
    imports: [AuthModule],
    controllers: [StoreController],
    providers: [
        CreateStoreUseCase,
        CreateStoreImageUseCase,
        CreateBusinessDocumentImageUseCase,
        ConfirmStoreImageUseCase,
        SubmitStoreUseCase,
        ListPartnerStoresUseCase,
        GetPartnerStoreDetailUseCase,
        GetPartnerOnboardingUseCase,
        ListPartnerStoreProgramsUseCase,
        UpdateStoreUseCase,
        UpdateBusinessDocumentUseCase,
        DeleteStoreImageUseCase,
        PartnerGuard,
    ],
})
export class StoreModule {}
