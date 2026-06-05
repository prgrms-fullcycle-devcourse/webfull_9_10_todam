import { ApiProperty } from '@nestjs/swagger';
import { createStoreRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 공방 초안 생성 요청. SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
// 중첩(convenienceInfo/operatingHours/businessDocument)은 스키마에 포함.
export class CreateStoreDto extends createZodDto(createStoreRequestSchema) {}

export class CreateStoreResponseStoreDto {
    @ApiProperty() id!: string;
    @ApiProperty() partnerId!: string;
    @ApiProperty() name!: string;
    @ApiProperty() slug!: string;
    @ApiProperty() status!: string;
    @ApiProperty() createdAt!: string;
}

export class CreateStoreResponseDto {
    @ApiProperty({ type: CreateStoreResponseStoreDto }) store!: CreateStoreResponseStoreDto;
}
