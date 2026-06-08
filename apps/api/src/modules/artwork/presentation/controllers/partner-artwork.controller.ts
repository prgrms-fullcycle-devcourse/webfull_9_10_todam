import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type {
    BulkUpdateArtworkStatusRequest,
    CountPartnerArtworksQuery,
    CreateArtworkPhotosRequest,
    ListPartnerArtworksQuery,
    UpdateArtworkDeliveryInfoRequest,
    UpdateArtworkDeliveryRequest,
    UpdateArtworkStatusRequest,
} from '@todam/shared';
import {
    bulkUpdateArtworkStatusRequestSchema,
    countPartnerArtworksQuerySchema,
    createArtworkPhotosRequestSchema,
    listPartnerArtworksQuerySchema,
    updateArtworkDeliveryInfoRequestSchema,
    updateArtworkDeliveryRequestSchema,
    updateArtworkStatusRequestSchema,
} from '@todam/shared';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../../common/decorators/response-message.decorator';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PartnerGuard } from '../../../../common/guards/partner.guard';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { BulkUpdateArtworkStatusUseCase } from '../../application/use-cases/bulk-update-artwork-status.use-case';
import { ConfirmArtworkPhotoUseCase } from '../../application/use-cases/confirm-artwork-photo.use-case';
import { CountPartnerArtworksUseCase } from '../../application/use-cases/count-partner-artworks.use-case';
import { CreateArtworkPhotosUseCase } from '../../application/use-cases/create-artwork-photos.use-case';
import { DeleteArtworkPhotoUseCase } from '../../application/use-cases/delete-artwork-photo.use-case';
import { GetPartnerArtworkDetailUseCase } from '../../application/use-cases/get-partner-artwork-detail.use-case';
import { ListPartnerArtworksUseCase } from '../../application/use-cases/list-partner-artworks.use-case';
import { UpdateArtworkDeliveryInfoUseCase } from '../../application/use-cases/update-artwork-delivery-info.use-case';
import { UpdateArtworkDeliveryUseCase } from '../../application/use-cases/update-artwork-delivery.use-case';
import { UpdateArtworkStatusUseCase } from '../../application/use-cases/update-artwork-status.use-case';
import {
    BulkUpdateArtworkStatusDto,
    BulkUpdateArtworkStatusResponseDto,
    ConfirmArtworkPhotoResponseDto,
    CountPartnerArtworksResponseDto,
    CreateArtworkPhotosDto,
    CreateArtworkPhotosResponseDto,
    DeleteArtworkPhotoResponseDto,
    GetPartnerArtworkDetailResponseDto,
    ListPartnerArtworksResponseDto,
    UpdateArtworkDeliveryDto,
    UpdateArtworkDeliveryInfoDto,
    UpdateArtworkDeliveryInfoResponseDto,
    UpdateArtworkDeliveryResponseDto,
    UpdateArtworkStatusDto,
    UpdateArtworkStatusResponseDto,
} from '../dto/partner-artwork.dto';

@ApiTags('partner-artworks')
@ApiBearerAuth()
@UseGuards(AuthGuard, PartnerGuard)
@Controller('partner')
export class PartnerArtworkController {
    constructor(
        private readonly listArtworks: ListPartnerArtworksUseCase,
        private readonly countArtworks: CountPartnerArtworksUseCase,
        private readonly getArtworkDetail: GetPartnerArtworkDetailUseCase,
        private readonly bulkUpdateStatus: BulkUpdateArtworkStatusUseCase,
        private readonly updateStatus: UpdateArtworkStatusUseCase,
        private readonly createPhotos: CreateArtworkPhotosUseCase,
        private readonly confirmPhotoUpload: ConfirmArtworkPhotoUseCase,
        private readonly deleteArtworkPhoto: DeleteArtworkPhotoUseCase,
        private readonly updateDeliveryInfo: UpdateArtworkDeliveryInfoUseCase,
        private readonly updateDelivery: UpdateArtworkDeliveryUseCase,
    ) {}

    @Get('stores/:storeId/artworks')
    @ResponseMessage('Partner artworks loaded.')
    @ApiOkResponse({ type: ListPartnerArtworksResponseDto })
    list(
        @CurrentUser() user: RequestUser,
        @Param('storeId') storeId: string,
        @Query(new ZodValidationPipe(listPartnerArtworksQuerySchema))
        query: ListPartnerArtworksQuery,
    ) {
        return this.listArtworks.execute(user.id, storeId, query);
    }

    @Get('artworks/count-by-step')
    @ResponseMessage('Partner artwork counts loaded.')
    @ApiOkResponse({ type: CountPartnerArtworksResponseDto })
    count(
        @CurrentUser() user: RequestUser,
        @Query(new ZodValidationPipe(countPartnerArtworksQuerySchema))
        query: CountPartnerArtworksQuery,
    ) {
        return this.countArtworks.execute(user.id, query);
    }

    @Get('artworks/:artworkId')
    @ResponseMessage('Partner artwork detail loaded.')
    @ApiOkResponse({ type: GetPartnerArtworkDetailResponseDto })
    detail(@CurrentUser() user: RequestUser, @Param('artworkId') artworkId: string) {
        return this.getArtworkDetail.execute(user.id, artworkId);
    }

    @Patch('artworks/bulk-status')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: BulkUpdateArtworkStatusDto })
    @ApiOkResponse({ type: BulkUpdateArtworkStatusResponseDto })
    @ResponseMessage('Artwork statuses updated.')
    bulkStatus(
        @CurrentUser() user: RequestUser,
        @Body(new ZodValidationPipe(bulkUpdateArtworkStatusRequestSchema))
        dto: BulkUpdateArtworkStatusRequest,
    ) {
        return this.bulkUpdateStatus.execute(user.id, dto);
    }

    @Patch('artworks/:artworkId/status')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: UpdateArtworkStatusDto })
    @ApiOkResponse({ type: UpdateArtworkStatusResponseDto })
    @ResponseMessage('Artwork status updated.')
    status(
        @CurrentUser() user: RequestUser,
        @Param('artworkId') artworkId: string,
        @Body(new ZodValidationPipe(updateArtworkStatusRequestSchema))
        dto: UpdateArtworkStatusRequest,
    ) {
        return this.updateStatus.execute(user.id, artworkId, dto);
    }

    @Post('artworks/:artworkId/photos')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: CreateArtworkPhotosDto })
    @ApiOkResponse({ type: CreateArtworkPhotosResponseDto })
    @ResponseMessage('Artwork photo upload URLs created.')
    photos(
        @CurrentUser() user: RequestUser,
        @Param('artworkId') artworkId: string,
        @Body(new ZodValidationPipe(createArtworkPhotosRequestSchema))
        dto: CreateArtworkPhotosRequest,
    ) {
        return this.createPhotos.execute(user.id, artworkId, dto);
    }

    @Post('artworks/:artworkId/photos/:photoId/confirm')
    @HttpCode(HttpStatus.OK)
    @ResponseMessage('Artwork photo confirmed.')
    @ApiOkResponse({ type: ConfirmArtworkPhotoResponseDto })
    confirmPhoto(
        @CurrentUser() user: RequestUser,
        @Param('artworkId') artworkId: string,
        @Param('photoId') photoId: string,
    ) {
        return this.confirmPhotoUpload.execute(user.id, artworkId, photoId);
    }

    @Delete('artworks/:artworkId/photos/:photoId')
    @HttpCode(HttpStatus.OK)
    @ResponseMessage('Artwork photo deleted.')
    @ApiOkResponse({ type: DeleteArtworkPhotoResponseDto })
    deletePhoto(
        @CurrentUser() user: RequestUser,
        @Param('artworkId') artworkId: string,
        @Param('photoId') photoId: string,
    ) {
        return this.deleteArtworkPhoto.execute(user.id, artworkId, photoId);
    }

    @Patch('artworks/:artworkId/delivery-info')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: UpdateArtworkDeliveryInfoDto })
    @ApiOkResponse({ type: UpdateArtworkDeliveryInfoResponseDto })
    @ResponseMessage('Artwork delivery information updated.')
    deliveryInfo(
        @CurrentUser() user: RequestUser,
        @Param('artworkId') artworkId: string,
        @Body(new ZodValidationPipe(updateArtworkDeliveryInfoRequestSchema))
        dto: UpdateArtworkDeliveryInfoRequest,
    ) {
        return this.updateDeliveryInfo.execute(user.id, artworkId, dto);
    }

    @Patch('artworks/:artworkId/delivery')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: UpdateArtworkDeliveryDto })
    @ApiOkResponse({ type: UpdateArtworkDeliveryResponseDto })
    @ResponseMessage('Artwork delivery status updated.')
    delivery(
        @CurrentUser() user: RequestUser,
        @Param('artworkId') artworkId: string,
        @Body(new ZodValidationPipe(updateArtworkDeliveryRequestSchema))
        dto: UpdateArtworkDeliveryRequest,
    ) {
        return this.updateDelivery.execute(user.id, artworkId, dto);
    }
}
