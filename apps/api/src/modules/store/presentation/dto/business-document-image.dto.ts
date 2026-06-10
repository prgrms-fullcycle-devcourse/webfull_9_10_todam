import {
    businessDocumentImageRequestSchema,
    businessDocumentImageResultSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청·응답 SSOT = @todam/shared(zod). 요청 검증은 컨트롤러 ZodValidationPipe, 응답은 Swagger 문서화.
export class CreateBusinessDocumentImageDto extends createZodDto(
    businessDocumentImageRequestSchema,
) {}
export class CreateBusinessDocumentImageResponseDto extends createZodDto(
    businessDocumentImageResultSchema,
) {}
