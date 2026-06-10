import { storeUpdateRequestSchema, storeUpdateResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 공방 정보 수정. 모든 필드 optional(부분 갱신 — DEC-2). operatingHours/images는 배열 전체 치환(DEC-4/OD-3).
// 요청·응답 SSOT = @todam/shared(zod). 요청 검증은 컨트롤러 ZodValidationPipe, 응답은 Swagger 문서화.
export class UpdateStoreDto extends createZodDto(storeUpdateRequestSchema) {}
export class UpdateStoreResponseDto extends createZodDto(storeUpdateResultSchema) {}
