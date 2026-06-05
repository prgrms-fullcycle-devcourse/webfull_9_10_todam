import { ApiProperty } from '@nestjs/swagger';
import { programImageUploadRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class CreateProgramImageDto extends createZodDto(programImageUploadRequestSchema) {}

export class CreateProgramImageResponseDto {
    @ApiProperty() programImageId!: string;
    @ApiProperty() uploadUrl!: string;
    @ApiProperty() imageUrl!: string;
}
