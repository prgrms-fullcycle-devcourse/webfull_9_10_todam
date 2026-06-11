import {
    registerNotificationTokenBodySchema,
    registerNotificationTokenResponseSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// POST /notifications/tokens — 요청 body
// SSOT: packages/shared/src/contracts/notification.ts registerNotificationTokenBodySchema
export class RegisterNotificationTokenBodyDto extends createZodDto(
    registerNotificationTokenBodySchema,
) {}

// POST /notifications/tokens — 응답
// SSOT: packages/shared/src/contracts/notification.ts registerNotificationTokenResponseSchema
export class RegisterNotificationTokenResponseDto extends createZodDto(
    registerNotificationTokenResponseSchema,
) {}
