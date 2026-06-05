import { sendCodeRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// SSOT = @todam/shared(zod). 요청 검증은 컨트롤러 param ZodValidationPipe가 수행.
export class SendCodeRequestDto extends createZodDto(sendCodeRequestSchema) {}
