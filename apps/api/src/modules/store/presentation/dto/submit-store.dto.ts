import { submitStoreResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 응답 SSOT = @todam/shared(zod). POST /partner/stores/{storeId}/submit 심사 제출 응답.
export class SubmitStoreResponseDto extends createZodDto(submitStoreResultSchema) {}
