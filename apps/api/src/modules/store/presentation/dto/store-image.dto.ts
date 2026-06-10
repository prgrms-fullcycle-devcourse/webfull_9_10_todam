import { createStoreImageRequestSchema, createStoreImageResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청·응답 SSOT = @todam/shared(zod). 요청 검증은 컨트롤러 ZodValidationPipe, 응답은 Swagger 문서화.
export class CreateStoreImageDto extends createZodDto(createStoreImageRequestSchema) {}
export class CreateStoreImageResponseDto extends createZodDto(createStoreImageResultSchema) {}
