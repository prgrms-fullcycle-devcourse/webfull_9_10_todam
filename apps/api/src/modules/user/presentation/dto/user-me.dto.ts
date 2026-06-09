import {
    getMyProfileResponseSchema,
    updateMyProfileBodySchema,
    updateMyProfileResponseSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// ─── GET /users/me ────────────────────────────────────────────────────────────
// 응답 SSOT = @todam/shared(zod). user.createdAt 포함.
export class GetMyProfileResponseDto extends createZodDto(getMyProfileResponseSchema) {}

// ─── PATCH /users/me ──────────────────────────────────────────────────────────
// 요청 SSOT = @todam/shared(zod). nickname 단일 필드, 정규식 검증 포함.
export class UpdateMyProfileDto extends createZodDto(updateMyProfileBodySchema) {}

// 응답 SSOT = @todam/shared(zod). user.updatedAt 포함.
export class UpdateMyProfileResponseDto extends createZodDto(updateMyProfileResponseSchema) {}
