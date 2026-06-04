import { ApiProperty } from '@nestjs/swagger';
import { StoreStatus } from '@prisma/client';

export class PublicStoreDetailConvenienceInfoDto {
    @ApiProperty({ example: true, description: '주차 가능 여부' })
    parking!: boolean;

    @ApiProperty({ example: false, description: '반려동물 동반 가능 여부' })
    pet!: boolean;

    @ApiProperty({ example: true, description: '와이파이 제공 여부' })
    wifi!: boolean;
}

export class PublicStoreDetailImageDto {
    @ApiProperty({ example: 'https://cdn.todam.example/stores/todam-jeonju/1.jpg' })
    imageUrl!: string;

    @ApiProperty({
        example: 'https://cdn.todam.example/stores/todam-jeonju/1-thumb.jpg',
        nullable: true,
    })
    thumbnailUrl!: string | null;
}

export class PublicStoreDetailLocationDto {
    @ApiProperty({ example: 37.5446 })
    lat!: number;

    @ApiProperty({ example: 127.056 })
    lng!: number;
}

export class PublicStoreDetailDto {
    @ApiProperty({
        example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        description: 'storeId. 찜 토글 path에 사용',
    })
    id!: string;

    @ApiProperty({ example: 'd5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a' })
    partnerId!: string;

    @ApiProperty({ example: 'todam-jeonju' })
    slug!: string;

    @ApiProperty({ example: '토담 전주 한옥마을점', description: '공방명' })
    name!: string;

    @ApiProperty({
        example: '한옥의 고즈넉함 속에서 즐기는 도자기 물레 체험 공방입니다.',
        description: '공방 소개',
    })
    description!: string;

    @ApiProperty({ example: '063-123-4567', description: '대표 연락처' })
    phone!: string;

    @ApiProperty({ example: '전북 전주시 완산구 교동 한옥마을길 12', description: '도로명 주소' })
    address!: string;

    @ApiProperty({
        enum: StoreStatus,
        example: StoreStatus.PUBLISHED,
        description: '항상 PUBLISHED',
    })
    status!: StoreStatus;

    @ApiProperty({ type: PublicStoreDetailConvenienceInfoDto })
    convenienceInfo!: PublicStoreDetailConvenienceInfoDto;

    @ApiProperty({ example: false })
    autoConfirm!: boolean;

    @ApiProperty({ example: '2026-05-25T10:00:00.000Z' })
    publishedAt!: string;

    @ApiProperty({
        type: [PublicStoreDetailImageDto],
        description: '대표 이미지 캐러셀(StoreImage, sortOrder 순)',
    })
    images!: PublicStoreDetailImageDto[];

    @ApiProperty({
        example: 4.9,
        nullable: true,
        description: '리뷰 평균 별점(isVisible=true). 리뷰 0건이면 null',
    })
    rating!: number | null;

    @ApiProperty({ example: 248, description: 'isVisible=true 리뷰 수' })
    reviewCount!: number;

    @ApiProperty({ type: PublicStoreDetailLocationDto, description: '지도 표시 좌표' })
    location!: PublicStoreDetailLocationDto;

    @ApiProperty({ example: false, description: '인증 시 찜 여부, 비인증 false' })
    isFavorite!: boolean;
}

export class GetStoreDetailResponseDto {
    @ApiProperty({ type: PublicStoreDetailDto })
    store!: PublicStoreDetailDto;
}
