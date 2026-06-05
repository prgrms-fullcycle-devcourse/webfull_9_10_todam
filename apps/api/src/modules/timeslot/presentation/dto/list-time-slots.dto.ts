import { ApiProperty } from '@nestjs/swagger';
import { listTimeSlotsQuerySchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class ListTimeSlotsQueryDto extends createZodDto(listTimeSlotsQuerySchema) {}

export class TimeSlotItemDto {
    @ApiProperty() slotId!: string;
    @ApiProperty() startAt!: string;
    @ApiProperty() endAt!: string;
    @ApiProperty() reservedCount!: number;
    @ApiProperty() remainingCount!: number;
    @ApiProperty() status!: string;
    @ApiProperty() confirmedReservationCount!: number;
    @ApiProperty() isRestricted!: boolean;
    @ApiProperty({ type: [String] }) restrictedProgramIds!: string[];
    @ApiProperty() createdAt!: string;
}

export class ListTimeSlotsResponseDto {
    @ApiProperty({ type: [TimeSlotItemDto] }) slots!: TimeSlotItemDto[];
}
