import { ApiProperty } from '@nestjs/swagger';

// POST /stores/:storeId/favorite 토글 결과(공통 봉투 data).
export class ToggleFavoriteStoreResponseDto {
    @ApiProperty({
        example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        description: 'path param echo. 찜 토글 대상 storeId',
    })
    storeId!: string;

    @ApiProperty({
        example: true,
        description: '토글 결과. true=찜 등록됨 / false=찜 해제됨',
    })
    isFavorite!: boolean;
}
