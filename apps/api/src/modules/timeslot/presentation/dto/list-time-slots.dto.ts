import { listTimeSlotsQuerySchema, listTimeSlotsResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

export class ListTimeSlotsQueryDto extends createZodDto(listTimeSlotsQuerySchema) {}

export class ListTimeSlotsResponseDto extends createZodDto(listTimeSlotsResultSchema) {}
