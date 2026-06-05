import { ApiProperty } from '@nestjs/swagger';
import { programEditRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 프로그램 수정 — 모든 필드 optional(partial update). 전송된 필드만 반영된다.
// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class UpdateProgramDto extends createZodDto(programEditRequestSchema) {}

export class UpdateProgramResponseProgramDto {
    @ApiProperty() id!: string;
    @ApiProperty() title!: string;
    @ApiProperty() price!: number;
    @ApiProperty() status!: string;
    @ApiProperty() updatedAt!: string;
}

export class UpdateProgramResponseDto {
    @ApiProperty({ type: UpdateProgramResponseProgramDto })
    program!: UpdateProgramResponseProgramDto;
}
