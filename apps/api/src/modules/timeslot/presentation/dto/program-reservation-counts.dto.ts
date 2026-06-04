import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class ProgramReservationCountsQueryDto {
    @ApiProperty({ example: '2026-06-10' })
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date는 YYYY-MM-DD 형식이어야 합니다.' })
    date!: string;

    // 콤마 구분 슬롯 id 목록(옵션). 미지정 시 date 전체 슬롯.
    @ApiPropertyOptional({ example: 'slot-1,slot-2' })
    @IsOptional()
    @IsString()
    timeSlotIds?: string;
}

export class ProgramReservationCountItemDto {
    @ApiProperty() programId!: string;
    @ApiProperty() programName!: string;
    @ApiProperty() confirmedReservationCount!: number;
}

export class ProgramReservationCountsResponseDto {
    @ApiProperty({ type: [ProgramReservationCountItemDto] })
    programs!: ProgramReservationCountItemDto[];
}
