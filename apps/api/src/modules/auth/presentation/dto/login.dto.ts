import { accessTokenResponseSchema, loginRequestSchema, loginResponseSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 로그인 요청/응답 DTO. SSOT = @todam/shared(zod). swagger 문서화용.
// 요청 검증은 컨트롤러 param `ZodValidationPipe(loginRequestSchema)`가 수행.
export class LoginRequestDto extends createZodDto(loginRequestSchema) {}
export class LoginResponseDto extends createZodDto(loginResponseSchema) {}

// 토큰 재발급(POST /auth/refresh) 응답 — accessToken만.
export class AccessTokenResponseDto extends createZodDto(accessTokenResponseSchema) {}
