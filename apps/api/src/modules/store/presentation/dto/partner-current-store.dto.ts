import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreStatus } from '@prisma/client';
import { updatePartnerCurrentStoreRequestSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

export class StoreIdItemDto {
    @ApiProperty({ description: '공방 ID', example: 'store-uuid' })
    id!: string;

    @ApiProperty({ description: '공방명', example: '흙과 사람' })
    name!: string;

    @ApiProperty({
        enum: StoreStatus,
        description: '공방 게시상태',
        example: StoreStatus.PUBLISHED,
    })
    status!: StoreStatus;
}

export class GetPartnerCurrentStoreResponseDto {
    @ApiPropertyOptional({
        description: '마지막 접속 공방 ID (미설정 시 null)',
        example: 'store-uuid',
        nullable: true,
    })
    lastAccessedStoreId!: string | null;

    @ApiProperty({ type: [StoreIdItemDto], description: '소유 공방 목록 (createdAt asc)' })
    stores!: StoreIdItemDto[];
}

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class UpdatePartnerCurrentStoreDto extends createZodDto(
    updatePartnerCurrentStoreRequestSchema,
) {}

export class UpdatePartnerCurrentStoreResponseDto {
    @ApiProperty({ description: '갱신된 lastAccessedStoreId', example: 'store-uuid' })
    lastAccessedStoreId!: string;
}
