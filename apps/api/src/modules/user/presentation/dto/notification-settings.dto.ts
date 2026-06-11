import {
    getNotificationSettingsResponseSchema,
    patchNotificationSettingsAllFieldsBodySchema,
    patchNotificationSettingsResponseSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// GET /users/me/notification-settings 응답
// SSOT: packages/shared/src/contracts/user-me.ts getNotificationSettingsResponseSchema
export class GetNotificationSettingsResponseDto extends createZodDto(
    getNotificationSettingsResponseSchema,
) {}

// PATCH /users/me/notification-settings 요청 body — BE all-fields scope
// SSOT: packages/shared/src/contracts/user-me.ts patchNotificationSettingsAllFieldsBodySchema
export class PatchNotificationSettingsBodyDto extends createZodDto(
    patchNotificationSettingsAllFieldsBodySchema,
) {}

// PATCH /users/me/notification-settings 응답
// SSOT: packages/shared/src/contracts/user-me.ts patchNotificationSettingsResponseSchema
export class PatchNotificationSettingsResponseDto extends createZodDto(
    patchNotificationSettingsResponseSchema,
) {}
