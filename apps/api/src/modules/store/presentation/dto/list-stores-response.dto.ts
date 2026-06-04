import { ApiProperty } from '@nestjs/swagger';

export class StoreConvenienceInfoDto {
    @ApiProperty({ example: true }) parking!: boolean;
    @ApiProperty({ example: false }) pet!: boolean;
    @ApiProperty({ example: true }) wifi!: boolean;
}

export class StoreRegionDto {
    @ApiProperty({ example: '서울', nullable: true }) sido!: string | null;
    @ApiProperty({ example: '성동구', nullable: true }) sigungu!: string | null;
    @ApiProperty({ example: '성수동', nullable: true }) dong!: string | null;
}

export class StoreRepresentativeClassDto {
    @ApiProperty({ example: '머그컵 만들기' }) name!: string;
    @ApiProperty({ example: 45000, description: 'KRW' }) price!: number;
    @ApiProperty({ example: true, description: '노출 클래스 2개 이상이면 true' })
    hasMore!: boolean;
}

export class StoreMatchedClassDto {
    @ApiProperty({ example: '머그컵 만들기' }) name!: string;
    @ApiProperty({ example: 45000, description: 'KRW' }) price!: number;
}

export class StoreListItemDto {
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' }) id!: string;
    @ApiProperty({ example: 'd5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a' }) partnerId!: string;
    @ApiProperty({ example: 'todam-jeonju' }) slug!: string;
    @ApiProperty({ example: '토담 전주 한옥마을점' }) name!: string;
    @ApiProperty({ example: '한옥의 고즈넉함 속에서 즐기는 도자기 물레 체험 공방입니다.' })
    description!: string;
    @ApiProperty({ example: '063-123-4567' }) phone!: string;
    @ApiProperty({ example: '전북 전주시 완산구 교동 한옥마을길 12' }) address!: string;
    @ApiProperty({ example: 'PUBLISHED', description: '항상 PUBLISHED' }) status!: string;

    @ApiProperty({ type: StoreConvenienceInfoDto })
    convenienceInfo!: StoreConvenienceInfoDto;

    @ApiProperty({ example: false }) autoConfirm!: boolean;

    @ApiProperty({ type: StoreRegionDto })
    region!: StoreRegionDto;

    @ApiProperty({
        example: 'https://cdn.todam.example/stores/todam-jeonju/thumb.jpg',
        nullable: true,
    })
    thumbnailUrl!: string | null;

    @ApiProperty({ example: 4.9, nullable: true, description: '리뷰 0건이면 null' })
    rating!: number | null;

    @ApiProperty({ example: 253 }) reviewCount!: number;

    @ApiProperty({
        example: 1400,
        nullable: true,
        description: '사용자 좌표 기준 거리(미터). lat/lng 미전송 시 null',
    })
    distance!: number | null;

    @ApiProperty({ type: StoreRepresentativeClassDto, nullable: true })
    representativeClass!: StoreRepresentativeClassDto | null;

    @ApiProperty({
        type: StoreMatchedClassDto,
        nullable: true,
        description: 'keyword가 프로그램명에 매칭될 때만 non-null(다건이면 최저가)',
    })
    matchedClass!: StoreMatchedClassDto | null;

    @ApiProperty({ example: true, description: '현재 운영시간 내 여부. false→준비 중' })
    isOperating!: boolean;

    @ApiProperty({ example: '2026-05-25T10:00:00.000Z' }) publishedAt!: string;
    @ApiProperty({ example: '2026-05-24T12:00:00.000Z' }) createdAt!: string;
}

export class StorePageInfoDto {
    @ApiProperty({
        example: 'eyJkaXN0YW5jZSI6MTQwMCwiaWQiOiJhMWIyYzNkNCJ9',
        nullable: true,
        description: '다음 페이지 커서. 마지막 페이지면 null',
    })
    nextCursor!: string | null;

    @ApiProperty({ example: true }) hasNext!: boolean;
}

export class ListStoresResponseDto {
    @ApiProperty({ type: [StoreListItemDto] })
    stores!: StoreListItemDto[];

    @ApiProperty({ type: StorePageInfoDto })
    pageInfo!: StorePageInfoDto;
}
