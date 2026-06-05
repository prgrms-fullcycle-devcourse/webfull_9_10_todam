import { ApiProperty } from '@nestjs/swagger';
import { createStoreImageRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class CreateStoreImageDto extends createZodDto(createStoreImageRequestSchema) {}

export class CreateStoreImageResponseDto {
    @ApiProperty() imageId!: string;
    @ApiProperty() uploadUrl!: string;
    @ApiProperty() imageUrl!: string;
}
