import { ApiProperty } from '@nestjs/swagger';
import { storeUpdateRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 공방 정보 수정 DTO. 모든 필드 optional(부분 갱신 — DEC-2).
// operatingHours / images 는 배열 전체 치환(DEC-4 / OD-3).
// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class UpdateStoreDto extends createZodDto(storeUpdateRequestSchema) {}

export class UpdateStoreResponseStoreDto {
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
    id!: string;

    @ApiProperty({ example: '토담 공방' })
    name!: string;

    @ApiProperty({ example: 'todam-studio' })
    slug!: string;

    @ApiProperty({ example: 'PUBLISHED' })
    status!: string;

    @ApiProperty({ example: '2026-05-25T18:20:00.000Z' })
    updatedAt!: string;
}

export class UpdateStoreResponseDto {
    @ApiProperty({ type: UpdateStoreResponseStoreDto })
    store!: UpdateStoreResponseStoreDto;
}
