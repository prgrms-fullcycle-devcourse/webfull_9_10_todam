import {
    createReservationRestrictionsRequestSchema,
    createReservationRestrictionsResultSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateReservationRestrictionsDto extends createZodDto(
    createReservationRestrictionsRequestSchema,
) {}

export class CreateReservationRestrictionsResponseDto extends createZodDto(
    createReservationRestrictionsResultSchema,
) {}
