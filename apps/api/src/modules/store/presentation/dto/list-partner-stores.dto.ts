import { ApiProperty } from '@nestjs/swagger';
import { StoreStatus } from '@prisma/client';

export class PartnerStoreListItemDto {
    @ApiProperty({ description: '공방 ID', example: 'store-seed-0001' })
    id!: string;

    @ApiProperty({ description: '공방명', example: '흙과 사람' })
    name!: string;

    @ApiProperty({ description: '대표자명', example: '김리듬' })
    ownerName!: string;

    @ApiProperty({
        description: '공방 게시 상태',
        enum: StoreStatus,
        example: StoreStatus.PUBLISHED,
    })
    status!: StoreStatus;

    @ApiProperty({
        description: '생성 일시 (ISO8601)',
        example: '2026-05-30T10:00:00.000Z',
    })
    createdAt!: string;
}

export class ListPartnerStoresResponseDto {
    @ApiProperty({ type: [PartnerStoreListItemDto] })
    stores!: PartnerStoreListItemDto[];
}
