import { availableSlotsQuerySchema, availableSlotsResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

export class AvailableSlotsQueryDto extends createZodDto(availableSlotsQuerySchema) {}

export class AvailableSlotsResponseDto extends createZodDto(availableSlotsResultSchema) {}
