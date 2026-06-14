import { updateTimeSlotStatusRequestSchema, updateTimeSlotStatusResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

export class UpdateTimeSlotStatusDto extends createZodDto(updateTimeSlotStatusRequestSchema) {}

export class UpdateTimeSlotStatusResponseDto extends createZodDto(
    updateTimeSlotStatusResultSchema,
) {}
