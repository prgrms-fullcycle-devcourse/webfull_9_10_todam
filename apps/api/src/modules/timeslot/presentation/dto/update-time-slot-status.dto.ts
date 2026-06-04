import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

const SLOT_STATUS_VALUES = ['OPEN', 'CLOSED', 'CANCELED'] as const;

export class UpdateTimeSlotStatusDto {
    @ApiProperty({ enum: SLOT_STATUS_VALUES, example: 'CLOSED' })
    @IsIn(SLOT_STATUS_VALUES, { message: 'status는 OPEN, CLOSED, CANCELED 중 하나여야 합니다.' })
    status!: (typeof SLOT_STATUS_VALUES)[number];
}

export class UpdateTimeSlotStatusResponseDto {
    @ApiProperty() slotId!: string;
    @ApiProperty() status!: string;
    @ApiProperty() updatedAt!: string;
}
