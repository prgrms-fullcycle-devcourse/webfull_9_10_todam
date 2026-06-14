import {
    deleteReservationRestrictionsRequestSchema,
    deleteReservationRestrictionsResultSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

export class DeleteReservationRestrictionsDto extends createZodDto(
    deleteReservationRestrictionsRequestSchema,
) {}

export class DeleteReservationRestrictionsResponseDto extends createZodDto(
    deleteReservationRestrictionsResultSchema,
) {}
