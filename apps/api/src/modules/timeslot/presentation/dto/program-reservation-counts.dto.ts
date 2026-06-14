import {
    programReservationCountsQuerySchema,
    programReservationCountsResultSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

export class ProgramReservationCountsQueryDto extends createZodDto(
    programReservationCountsQuerySchema,
) {}

export class ProgramReservationCountsResponseDto extends createZodDto(
    programReservationCountsResultSchema,
) {}
