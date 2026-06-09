import { publicStoreDetailResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 응답 SSOT = @todam/shared(zod). GET /stores/{slug} 공개 공방 상세.
export class GetStoreDetailResponseDto extends createZodDto(publicStoreDetailResultSchema) {}
