import { withdrawBodySchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// DELETE /users/me — 회원탈퇴 요청 body
// 소셜 유저는 password 없이 요청 가능. 이메일 유저는 use-case에서 password 필수 검증.
export class WithdrawDto extends createZodDto(withdrawBodySchema) {}
