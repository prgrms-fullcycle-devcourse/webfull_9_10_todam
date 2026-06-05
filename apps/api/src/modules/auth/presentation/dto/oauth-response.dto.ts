import { oauthResponseSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// SSOT = @todam/shared(zod). 소셜 로그인 응답 = 로그인 응답과 동일 스키마.
export class OAuthResponseDto extends createZodDto(oauthResponseSchema) {}
