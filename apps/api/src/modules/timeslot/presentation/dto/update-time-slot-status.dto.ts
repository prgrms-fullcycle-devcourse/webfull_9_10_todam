import { ApiProperty } from '@nestjs/swagger';
import { updateTimeSlotStatusRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class UpdateTimeSlotStatusDto extends createZodDto(updateTimeSlotStatusRequestSchema) {}

export class UpdateTimeSlotStatusResponseDto {
    @ApiProperty() slotId!: string;
    @ApiProperty() status!: string;
    @ApiProperty() updatedAt!: string;
}
