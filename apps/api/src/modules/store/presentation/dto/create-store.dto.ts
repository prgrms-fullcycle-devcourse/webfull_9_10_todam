import { createStoreRequestSchema, createStoreResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 공방 초안 생성. 요청·응답 SSOT = @todam/shared(zod). 요청 검증은 컨트롤러 ZodValidationPipe.
// 중첩(convenienceInfo/operatingHours/businessDocument)은 스키마에 포함.
export class CreateStoreDto extends createZodDto(createStoreRequestSchema) {}
export class CreateStoreResponseDto extends createZodDto(createStoreResultSchema) {}
