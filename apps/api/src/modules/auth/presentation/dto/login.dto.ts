import { loginRequestSchema, loginResponseSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 로그인 요청/응답 DTO. SSOT = @todam/shared(zod). swagger 문서화용.
// 요청 검증은 컨트롤러 param `ZodValidationPipe(loginRequestSchema)`가 수행.
export class LoginRequestDto extends createZodDto(loginRequestSchema) {}
export class LoginResponseDto extends createZodDto(loginResponseSchema) {}
