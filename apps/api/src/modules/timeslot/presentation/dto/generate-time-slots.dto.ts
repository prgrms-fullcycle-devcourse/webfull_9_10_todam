import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class GenerateTimeSlotsDto {
    @ApiProperty({ example: '2026-06-01' })
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate는 YYYY-MM-DD 형식이어야 합니다.' })
    startDate!: string;

    @ApiProperty({ example: '2026-06-07' })
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate는 YYYY-MM-DD 형식이어야 합니다.' })
    endDate!: string;
}

export class GeneratedSlotDto {
    @ApiProperty() slotId!: string;
    @ApiProperty() startAt!: string;
    @ApiProperty() endAt!: string;
    @ApiProperty() status!: string;
    @ApiProperty() reservedCount!: number;
}

export class GenerateTimeSlotsResponseDto {
    @ApiProperty() createdCount!: number;
    @ApiProperty() skippedCount!: number;
    @ApiProperty({ type: [GeneratedSlotDto] }) createdSlots!: GeneratedSlotDto[];
}
