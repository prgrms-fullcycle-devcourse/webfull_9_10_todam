import { ApiProperty } from '@nestjs/swagger';
import { deleteReservationRestrictionsRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// D-DELETE-UX: 조건 매칭(시각 기반) 우선 + 개별 restrictionIds 도 지원.
// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class DeleteReservationRestrictionsDto extends createZodDto(
    deleteReservationRestrictionsRequestSchema,
) {}

export class DeleteReservationRestrictionsResponseDto {
    @ApiProperty() removedCount!: number;
}
