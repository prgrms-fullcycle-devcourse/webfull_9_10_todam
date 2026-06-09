import { partnerDashboardStoreItemSchema, partnerDashboardStoresResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

export class PartnerStoreListItemDto extends createZodDto(partnerDashboardStoreItemSchema) {}

export class ListPartnerStoresResponseDto extends createZodDto(
    partnerDashboardStoresResultSchema,
) {}
