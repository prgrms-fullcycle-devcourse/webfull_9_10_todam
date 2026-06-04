import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

const SLOT_STATUS_VALUES = ['OPEN', 'CLOSED', 'CANCELED'] as const;

export class ListTimeSlotsQueryDto {
    @ApiPropertyOptional({ example: '2026-06-10' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date는 YYYY-MM-DD 형식이어야 합니다.' })
    date?: string;

    @ApiPropertyOptional({ example: '2026-06-01' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate는 YYYY-MM-DD 형식이어야 합니다.' })
    startDate?: string;

    @ApiPropertyOptional({ example: '2026-06-07' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate는 YYYY-MM-DD 형식이어야 합니다.' })
    endDate?: string;

    @ApiPropertyOptional({ enum: SLOT_STATUS_VALUES })
    @IsOptional()
    @IsIn(SLOT_STATUS_VALUES, { message: 'status는 OPEN, CLOSED, CANCELED 중 하나여야 합니다.' })
    status?: (typeof SLOT_STATUS_VALUES)[number];
}

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
