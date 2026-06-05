import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { TIME_SLOT_STATUS_VALUES } from '../../domain/entities/store-time-slot.entity';
import type { TimeSlotStatus } from '../../domain/entities/store-time-slot.entity';

export class UpdateTimeSlotStatusDto {
    @ApiProperty({ enum: TIME_SLOT_STATUS_VALUES, example: 'CLOSED' })
    @IsIn(TIME_SLOT_STATUS_VALUES, {
        message: 'status는 OPEN, CLOSED, CANCELED 중 하나여야 합니다.',
    })
    status!: TimeSlotStatus;
}

export class UpdateTimeSlotStatusResponseDto {
    @ApiProperty() slotId!: string;
    @ApiProperty() status!: string;
    @ApiProperty() updatedAt!: string;
}
