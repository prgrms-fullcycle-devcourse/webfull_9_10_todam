import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { TIME_SLOT_STATUS_VALUES } from '../../domain/entities/store-time-slot.entity';
import type { TimeSlotStatus } from '../../domain/entities/store-time-slot.entity';

export class AvailableSlotsQueryDto {
    @ApiProperty({ example: 2026 })
    @Type(() => Number)
    @IsInt({ message: 'year는 정수여야 합니다.' })
    @Min(2000, { message: 'year가 올바르지 않습니다.' })
    @Max(2100, { message: 'year가 올바르지 않습니다.' })
    year!: number;

    @ApiProperty({ example: 6 })
    @Type(() => Number)
    @IsInt({ message: 'month는 정수여야 합니다.' })
    @Min(1, { message: 'month는 1~12 사이여야 합니다.' })
    @Max(12, { message: 'month는 1~12 사이여야 합니다.' })
    month!: number;
}

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
