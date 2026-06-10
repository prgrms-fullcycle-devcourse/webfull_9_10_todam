import {
    businessDocumentUpdateRequestSchema,
    businessDocumentUpdateResultSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 반려(REJECTED) 공방 재수정용. 변경 필드만 부분 갱신. 저장 시 재심사(REJECTED→PENDING) 전이.
// 요청·응답 SSOT = @todam/shared(zod). 요청 검증은 컨트롤러 ZodValidationPipe, 응답은 Swagger 문서화.
export class UpdateBusinessDocumentDto extends createZodDto(businessDocumentUpdateRequestSchema) {}
export class UpdateBusinessDocumentResponseDto extends createZodDto(
    businessDocumentUpdateResultSchema,
) {}
