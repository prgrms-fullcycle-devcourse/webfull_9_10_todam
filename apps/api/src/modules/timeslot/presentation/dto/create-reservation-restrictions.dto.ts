import { ApiProperty } from '@nestjs/swagger';
import { createReservationRestrictionsRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class CreateReservationRestrictionsDto extends createZodDto(
    createReservationRestrictionsRequestSchema,
) {}

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
