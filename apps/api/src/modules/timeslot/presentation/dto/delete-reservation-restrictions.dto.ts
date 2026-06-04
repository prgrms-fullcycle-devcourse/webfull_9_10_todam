import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID, Matches, ValidateNested } from 'class-validator';
import { TimeRangeDto } from './create-reservation-restrictions.dto';

// D-DELETE-UX: 조건 매칭(시각 기반) 우선 + 개별 restrictionIds 도 지원.
export class DeleteReservationRestrictionsDto {
    @ApiPropertyOptional({ example: '2026-06-10' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date는 YYYY-MM-DD 형식이어야 합니다.' })
    date?: string;

    @ApiPropertyOptional({ type: [TimeRangeDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TimeRangeDto)
    timeRanges?: TimeRangeDto[];

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    programIds?: string[];

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    restrictionIds?: string[];
}

export class DeleteReservationRestrictionsResponseDto {
    @ApiProperty() removedCount!: number;
}
