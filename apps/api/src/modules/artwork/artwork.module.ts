import { Module } from '@nestjs/common';
import { PartnerGuard } from '../../common/guards/partner.guard';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { BulkUpdateArtworkStatusUseCase } from './application/use-cases/bulk-update-artwork-status.use-case';
import { ConfirmArtworkPhotoUseCase } from './application/use-cases/confirm-artwork-photo.use-case';
import { CountPartnerArtworksUseCase } from './application/use-cases/count-partner-artworks.use-case';
import { CreateArtworkPhotosUseCase } from './application/use-cases/create-artwork-photos.use-case';
import { DeleteArtworkPhotoUseCase } from './application/use-cases/delete-artwork-photo.use-case';
import { GetArtworkDetailUseCase } from './application/use-cases/get-artwork-detail.use-case';
import { GetPartnerArtworkDetailUseCase } from './application/use-cases/get-partner-artwork-detail.use-case';
import { ListPartnerArtworksUseCase } from './application/use-cases/list-partner-artworks.use-case';
import { UpdateArtworkDeliveryInfoUseCase } from './application/use-cases/update-artwork-delivery-info.use-case';
import { UpdateArtworkDeliveryUseCase } from './application/use-cases/update-artwork-delivery.use-case';
import { UpdateArtworkStatusUseCase } from './application/use-cases/update-artwork-status.use-case';
import { ArtworkRepository } from './domain/repositories/artwork.repository';
import { PrismaArtworkRepository } from './infrastructure/persistence/prisma-artwork.repository';
import { ArtworkController } from './presentation/controllers/artwork.controller';
import { PartnerArtworkController } from './presentation/controllers/partner-artwork.controller';

@Module({
    imports: [AuthModule, NotificationModule],
    controllers: [PartnerArtworkController, ArtworkController],
    providers: [
        ListPartnerArtworksUseCase,
        CountPartnerArtworksUseCase,
        GetPartnerArtworkDetailUseCase,
        GetArtworkDetailUseCase,
        BulkUpdateArtworkStatusUseCase,
        UpdateArtworkStatusUseCase,
        CreateArtworkPhotosUseCase,
        ConfirmArtworkPhotoUseCase,
        DeleteArtworkPhotoUseCase,
        UpdateArtworkDeliveryInfoUseCase,
        UpdateArtworkDeliveryUseCase,
        { provide: ArtworkRepository, useClass: PrismaArtworkRepository },
        PartnerGuard,
    ],
})
export class ArtworkModule {}
