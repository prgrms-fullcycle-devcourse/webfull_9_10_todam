import { businessDocumentOcrRequestSchema, businessDocumentOcrResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청·응답 SSOT = @todam/shared(zod). 요청 검증은 컨트롤러 ZodValidationPipe,
// 응답은 Swagger 문서화. 스키마의 .meta({ example })가 그대로 OpenAPI에 반영된다.
export class OcrBusinessDocumentDto extends createZodDto(businessDocumentOcrRequestSchema) {}
export class OcrBusinessDocumentResponseDto extends createZodDto(businessDocumentOcrResultSchema) {}
