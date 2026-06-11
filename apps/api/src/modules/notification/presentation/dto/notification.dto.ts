import {
    getNotificationsQuerySchema,
    getNotificationsResponseSchema,
    readNotificationResponseSchema,
    readAllNotificationsResponseSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// GET /notifications — 쿼리 파라미터
// SSOT: packages/shared/src/contracts/notification.ts getNotificationsQuerySchema
export class GetNotificationsQueryDto extends createZodDto(getNotificationsQuerySchema) {}

// GET /notifications — 응답
// SSOT: packages/shared/src/contracts/notification.ts getNotificationsResponseSchema
export class GetNotificationsResponseDto extends createZodDto(getNotificationsResponseSchema) {}

// PATCH /notifications/:id/read — 응답
// SSOT: packages/shared/src/contracts/notification.ts readNotificationResponseSchema
export class ReadNotificationResponseDto extends createZodDto(readNotificationResponseSchema) {}

// PATCH /notifications/read-all — 응답
// SSOT: packages/shared/src/contracts/notification.ts readAllNotificationsResponseSchema
export class ReadAllNotificationsResponseDto extends createZodDto(
    readAllNotificationsResponseSchema,
) {}
