import {
    bulkUpdateArtworkStatusRequestSchema,
    bulkUpdateArtworkStatusResultSchema,
    confirmArtworkPhotoResultSchema,
    countPartnerArtworksQuerySchema,
    countPartnerArtworksResultSchema,
    createArtworkPhotosRequestSchema,
    createArtworkPhotosResultSchema,
    deleteArtworkPhotoResultSchema,
    getPartnerArtworkDetailResultSchema,
    listPartnerArtworksQuerySchema,
    listPartnerArtworksResultSchema,
    updateArtworkDeliveryInfoResultSchema,
    updateArtworkDeliveryResultSchema,
    updateArtworkDeliveryInfoRequestSchema,
    updateArtworkStatusRequestSchema,
    updateArtworkStatusResultSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

export class ListPartnerArtworksQueryDto extends createZodDto(listPartnerArtworksQuerySchema) {}
export class ListPartnerArtworksResponseDto extends createZodDto(listPartnerArtworksResultSchema) {}
export class CountPartnerArtworksQueryDto extends createZodDto(countPartnerArtworksQuerySchema) {}
export class CountPartnerArtworksResponseDto extends createZodDto(
    countPartnerArtworksResultSchema,
) {}
export class GetPartnerArtworkDetailResponseDto extends createZodDto(
    getPartnerArtworkDetailResultSchema,
) {}
export class UpdateArtworkStatusDto extends createZodDto(updateArtworkStatusRequestSchema) {}
export class UpdateArtworkStatusResponseDto extends createZodDto(updateArtworkStatusResultSchema) {}
export class BulkUpdateArtworkStatusDto extends createZodDto(
    bulkUpdateArtworkStatusRequestSchema,
) {}
export class BulkUpdateArtworkStatusResponseDto extends createZodDto(
    bulkUpdateArtworkStatusResultSchema,
) {}
export class CreateArtworkPhotosDto extends createZodDto(createArtworkPhotosRequestSchema) {}
export class CreateArtworkPhotosResponseDto extends createZodDto(createArtworkPhotosResultSchema) {}
export class ConfirmArtworkPhotoResponseDto extends createZodDto(confirmArtworkPhotoResultSchema) {}
export class DeleteArtworkPhotoResponseDto extends createZodDto(deleteArtworkPhotoResultSchema) {}
export class UpdateArtworkDeliveryInfoDto extends createZodDto(
    updateArtworkDeliveryInfoRequestSchema,
) {}
export class UpdateArtworkDeliveryInfoResponseDto extends createZodDto(
    updateArtworkDeliveryInfoResultSchema,
) {}
export class UpdateArtworkDeliveryResponseDto extends createZodDto(
    updateArtworkDeliveryResultSchema,
) {}
export class UpdateArtworkDeliveryDto {
    action!: 'SHIP' | 'PICKUP_READY' | 'PICKUP_DONE' | 'DELIVERED';
    trackingNumber?: string;
    carrier?: string;
    shippedAt?: string;
}
