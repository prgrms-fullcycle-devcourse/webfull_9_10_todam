import { ApiProperty } from '@nestjs/swagger';
import { updateProgramStatusRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class UpdateProgramStatusDto extends createZodDto(updateProgramStatusRequestSchema) {}

export class UpdateProgramStatusResponseProgramDto {
    @ApiProperty() id!: string;
    @ApiProperty() status!: string;
    @ApiProperty() updatedAt!: string;
}

export class UpdateProgramStatusResponseDto {
    @ApiProperty({ type: UpdateProgramStatusResponseProgramDto })
    program!: UpdateProgramStatusResponseProgramDto;
}
