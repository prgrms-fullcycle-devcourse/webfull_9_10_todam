import { generateTimeSlotsRequestSchema, generateTimeSlotsResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

export class GenerateTimeSlotsDto extends createZodDto(generateTimeSlotsRequestSchema) {}

export class GenerateTimeSlotsResponseDto extends createZodDto(generateTimeSlotsResultSchema) {}
