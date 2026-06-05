import { ApiProperty } from '@nestjs/swagger';
import { businessDocumentImageRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class CreateBusinessDocumentImageDto extends createZodDto(
    businessDocumentImageRequestSchema,
) {}

export class CreateBusinessDocumentImageResponseDto {
    @ApiProperty() uploadUrl!: string;
    @ApiProperty() documentUrl!: string;
}
