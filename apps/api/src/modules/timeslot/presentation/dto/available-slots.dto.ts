import { ApiProperty } from '@nestjs/swagger';
import { availableSlotsQuerySchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';
import { TIME_SLOT_STATUS_VALUES } from '../../domain/entities/store-time-slot.entity';
import type { TimeSlotStatus } from '../../domain/entities/store-time-slot.entity';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class AvailableSlotsQueryDto extends createZodDto(availableSlotsQuerySchema) {}

export class AvailableSlotItemDto {
    @ApiProperty() slotId!: string;
    @ApiProperty() startAt!: string;
    @ApiProperty() endAt!: string;
    @ApiProperty() reservedCount!: number;
    @ApiProperty() remainingCount!: number;
    @ApiProperty({ enum: TIME_SLOT_STATUS_VALUES }) status!: TimeSlotStatus;
    // 이 프로그램으로 예약 가능 여부 = OPEN && 제한 없음 && 잔여>0. CLOSED/CANCELED/만석/제한 시 false.
    @ApiProperty() isAvailable!: boolean;
}

export class AvailableSlotsResponseDto {
    @ApiProperty({ type: [AvailableSlotItemDto] }) slots!: AvailableSlotItemDto[];
}
