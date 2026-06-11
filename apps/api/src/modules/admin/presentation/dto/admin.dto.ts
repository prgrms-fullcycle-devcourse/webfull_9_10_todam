import {
    adminLoginRequestSchema,
    adminLoginResponseSchema,
    adminStoreRejectRequestSchema,
    adminStoreSuspendRequestSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

export class AdminLoginRequestDto extends createZodDto(adminLoginRequestSchema) {}
export class AdminLoginResponseDto extends createZodDto(adminLoginResponseSchema) {}
export class AdminStoreRejectRequestDto extends createZodDto(adminStoreRejectRequestSchema) {}
export class AdminStoreSuspendRequestDto extends createZodDto(adminStoreSuspendRequestSchema) {}
