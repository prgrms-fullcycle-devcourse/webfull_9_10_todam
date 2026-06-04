import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsIn,
    IsISO8601,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    ValidateNested,
} from 'class-validator';

const SCOPE_VALUES = ['ALL_DAY', 'TIME_SLOTS'] as const;

export class TimeRangeDto {
    @ApiProperty({ example: '2026-06-10T10:00:00+09:00' })
    @IsISO8601()
    startAt!: string;

    @ApiProperty({ example: '2026-06-10T12:00:00+09:00' })
    @IsISO8601()
    endAt!: string;
}

export class CreateReservationRestrictionsDto {
    @ApiProperty({ example: '2026-06-10' })
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date는 YYYY-MM-DD 형식이어야 합니다.' })
    date!: string;

    @ApiProperty({ enum: SCOPE_VALUES, example: 'TIME_SLOTS' })
    @IsIn(SCOPE_VALUES, { message: 'scope는 ALL_DAY, TIME_SLOTS 중 하나여야 합니다.' })
    scope!: (typeof SCOPE_VALUES)[number];

    @ApiPropertyOptional({ type: [TimeRangeDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TimeRangeDto)
    timeRanges?: TimeRangeDto[];

    @ApiProperty({ type: [String] })
    @IsArray()
    @ArrayMinSize(1, { message: 'programIds는 최소 1개 이상이어야 합니다.' })
    @IsUUID('all', { each: true })
    programIds!: string[];
}

export class CreatedRestrictionDto {
    @ApiProperty() id!: string;
    @ApiProperty() startAt!: string;
    @ApiProperty() endAt!: string;
    @ApiProperty() programId!: string;
}

export class CreateReservationRestrictionsResponseDto {
    @ApiProperty() appliedCount!: number;
    @ApiProperty({ type: [CreatedRestrictionDto] }) restrictions!: CreatedRestrictionDto[];
}
