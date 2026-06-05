import { ApiProperty } from '@nestjs/swagger';
import { programReservationCountsQuerySchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class ProgramReservationCountsQueryDto extends createZodDto(
    programReservationCountsQuerySchema,
) {}

export class ProgramReservationCountItemDto {
    @ApiProperty() programId!: string;
    @ApiProperty() programName!: string;
    @ApiProperty() confirmedReservationCount!: number;
}

export class ProgramReservationCountsResponseDto {
    @ApiProperty({ type: [ProgramReservationCountItemDto] })
    programs!: ProgramReservationCountItemDto[];
}
