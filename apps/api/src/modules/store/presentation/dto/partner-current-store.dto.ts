import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreStatus } from '@prisma/client';
import { IsUUID } from 'class-validator';

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

export class UpdatePartnerCurrentStoreDto {
    @ApiProperty({ description: '전환할 공방 ID', example: 'store-uuid' })
    @IsUUID()
    storeId!: string;
}

export class UpdatePartnerCurrentStoreResponseDto {
    @ApiProperty({ description: '갱신된 lastAccessedStoreId', example: 'store-uuid' })
    lastAccessedStoreId!: string;
}
