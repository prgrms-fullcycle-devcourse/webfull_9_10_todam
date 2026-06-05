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
import { UpdateStoreUseCase } from './application/use-cases/update-store.use-case';
import { UpdateBusinessDocumentUseCase } from './application/use-cases/update-business-document.use-case';
import { DeleteStoreImageUseCase } from './application/use-cases/delete-store-image.use-case';
import { ListStoresUseCase } from './application/use-cases/list-stores.use-case';
import { AutocompleteStoresUseCase } from './application/use-cases/autocomplete-stores.use-case';
import { GetSlugAvailabilityUseCase } from './application/use-cases/get-slug-availability.use-case';
import { GetStoreDetailUseCase } from './application/use-cases/get-store-detail.use-case';
import { ListStoreProgramsUseCase } from './application/use-cases/list-store-programs.use-case';
import { ListStoreReviewsUseCase } from './application/use-cases/list-store-reviews.use-case';
import { ToggleFavoriteStoreUseCase } from './application/use-cases/toggle-favorite-store.use-case';
import { PartnerGuard } from '../../common/guards/partner.guard';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';
import { StoreImageRepository } from './domain/repositories/store-image.repository';
import { StoreRepository } from './domain/repositories/store.repository';
import { StoreQueryReader } from './domain/repositories/store-query.reader';
import { StoreCommandRepository } from './domain/repositories/store-command.repository';
import { PrismaStoreImageRepository } from './infrastructure/persistence/prisma-store-image.repository';
import { PrismaStoreRepository } from './infrastructure/persistence/prisma-store.repository';
import { PrismaAutocompleteStoresReader } from './infrastructure/persistence/prisma-autocomplete-stores.reader';
import { PrismaPartnerOnboardingReader } from './infrastructure/persistence/prisma-partner-onboarding.reader';
import { PrismaPartnerStoreDetailReader } from './infrastructure/persistence/prisma-partner-store-detail.reader';
import { PrismaPartnerStoresReader } from './infrastructure/persistence/prisma-partner-stores.reader';
import { PrismaSlugAvailabilityReader } from './infrastructure/persistence/prisma-slug-availability.reader';
import { PrismaStoreDetailReader } from './infrastructure/persistence/prisma-store-detail.reader';
import { PrismaStoreProgramsReader } from './infrastructure/persistence/prisma-store-programs.reader';
import { PrismaStoreQueryReader } from './infrastructure/persistence/prisma-store-query.reader';
import { PrismaStoreReviewsReader } from './infrastructure/persistence/prisma-store-reviews.reader';
import { PrismaStoresReader } from './infrastructure/persistence/prisma-stores.reader';
import { PrismaCreateStoreCommand } from './infrastructure/persistence/prisma-create-store.command';
import { PrismaStoreCommandRepository } from './infrastructure/persistence/prisma-store-command.repository';
import { PrismaToggleFavoriteStoreCommand } from './infrastructure/persistence/prisma-toggle-favorite-store.command';
import { PrismaUpdateBusinessDocumentCommand } from './infrastructure/persistence/prisma-update-business-document.command';
import { PrismaUpdateStoreCommand } from './infrastructure/persistence/prisma-update-store.command';
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
        UpdateStoreUseCase,
        UpdateBusinessDocumentUseCase,
        DeleteStoreImageUseCase,
        ListStoresUseCase,
        AutocompleteStoresUseCase,
        GetSlugAvailabilityUseCase,
        GetStoreDetailUseCase,
        ListStoreProgramsUseCase,
        ListStoreReviewsUseCase,
        ToggleFavoriteStoreUseCase,
        { provide: StoreImageRepository, useClass: PrismaStoreImageRepository },
        { provide: StoreRepository, useClass: PrismaStoreRepository },
        { provide: StoreQueryReader, useClass: PrismaStoreQueryReader },
        { provide: StoreCommandRepository, useClass: PrismaStoreCommandRepository },
        PrismaCreateStoreCommand,
        PrismaToggleFavoriteStoreCommand,
        PrismaUpdateBusinessDocumentCommand,
        PrismaUpdateStoreCommand,
        PrismaAutocompleteStoresReader,
        PrismaPartnerOnboardingReader,
        PrismaPartnerStoreDetailReader,
        PrismaPartnerStoresReader,
        PrismaSlugAvailabilityReader,
        PrismaStoreDetailReader,
        PrismaStoreProgramsReader,
        PrismaStoreReviewsReader,
        PrismaStoresReader,
        PartnerGuard,
        OptionalAuthGuard,
    ],
})
export class StoreModule {}
