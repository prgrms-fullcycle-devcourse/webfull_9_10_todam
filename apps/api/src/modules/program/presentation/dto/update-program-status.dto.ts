import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

const PROGRAM_STATUS_VALUES = ['DRAFT', 'ACTIVE', 'INACTIVE'] as const;

export class UpdateProgramStatusDto {
    @ApiProperty({ enum: PROGRAM_STATUS_VALUES, example: 'ACTIVE' })
    @IsIn(PROGRAM_STATUS_VALUES, {
        message: '상태는 DRAFT, ACTIVE, INACTIVE 중 하나여야 합니다.',
    })
    status!: (typeof PROGRAM_STATUS_VALUES)[number];
}

export class UpdateProgramStatusResponseProgramDto {
    @ApiProperty() id!: string;
    @ApiProperty() status!: string;
    @ApiProperty() updatedAt!: string;
}

export class UpdateProgramStatusResponseDto {
    @ApiProperty({ type: UpdateProgramStatusResponseProgramDto })
    program!: UpdateProgramStatusResponseProgramDto;
}
