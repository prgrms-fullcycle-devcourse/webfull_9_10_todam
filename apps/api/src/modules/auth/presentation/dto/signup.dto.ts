import { signupRequestSchema, signupResponseSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// SSOT = @todam/shared(zod). 요청 검증은 컨트롤러 param ZodValidationPipe가 수행.
export class SignupRequestDto extends createZodDto(signupRequestSchema) {}
export class SignupResponseDto extends createZodDto(signupResponseSchema) {}
