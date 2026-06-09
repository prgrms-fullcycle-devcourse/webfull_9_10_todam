import { partnerStoreDetailResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 응답 SSOT = @todam/shared(zod). GET /partner/stores/{storeId} 내 공방 상세.
export class GetPartnerStoreDetailResponseDto extends createZodDto(
    partnerStoreDetailResultSchema,
) {}
