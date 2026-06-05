import { ApiProperty } from '@nestjs/swagger';
import { createProgramRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class CreateProgramDto extends createZodDto(createProgramRequestSchema) {}

export class CreateProgramResponseProgramDto {
    @ApiProperty() id!: string;
    @ApiProperty() storeId!: string;
    @ApiProperty() title!: string;
    @ApiProperty() status!: string;
    @ApiProperty() createdAt!: string;
}

export class CreateProgramResponseDto {
    @ApiProperty({ type: CreateProgramResponseProgramDto })
    program!: CreateProgramResponseProgramDto;
}
