import { ApiProperty } from '@nestjs/swagger';

export class StoreReviewPhotoDto {
    @ApiProperty({
        example: 'https://cdn.todam.example/reviews/review-uuid-001/1.jpg',
        description: '확대보기 원본 이미지 URL',
    })
    imageUrl!: string;

    @ApiProperty({
        example: 'https://cdn.todam.example/reviews/review-uuid-001/1-thumb.jpg',
        description: '목록 썸네일 URL (없으면 imageUrl과 동일)',
    })
    thumbnailUrl!: string;
}

export class StoreReviewListItemDto {
    @ApiProperty({ example: 'review-uuid-001', description: 'review UUID' })
    id!: string;

    @ApiProperty({ example: 'use*****', description: '마스킹된 작성자명' })
    nickname!: string;

    @ApiProperty({ example: 5, description: '1~5 정수' })
    rating!: number;

    @ApiProperty({
        example: '물레 만지는 것은 처음인데도 사장님께서 친절하게 알려주셔서 ...',
        description: '본문 (빈 문자열 가능)',
    })
    content!: string;

    @ApiProperty({ type: [StoreReviewPhotoDto], description: '0~3장' })
    photos!: StoreReviewPhotoDto[];

    @ApiProperty({
        example: '머그컵 만들기',
        description: '작성 대상 클래스명 (예약→프로그램 title)',
    })
    programTitle!: string;

    @ApiProperty({ example: '2026-05-24T12:00:00.000Z', description: 'ISO 8601' })
    createdAt!: string;
}

export class StoreReviewPageInfoDto {
    @ApiProperty({
        example:
            'eyJjcmVhdGVkQXQiOiIyMDI2LTA1LTI0VDEyOjAwOjAwLjAwMFoiLCJpZCI6InJldmlldy11dWlkLTAwMSJ9',
        nullable: true,
        description: '다음 페이지 커서. 마지막 페이지면 null',
    })
    nextCursor!: string | null;

    @ApiProperty({ example: true })
    hasNext!: boolean;
}

export class ListStoreReviewsResponseDto {
    @ApiProperty({ type: [StoreReviewListItemDto] })
    reviews!: StoreReviewListItemDto[];

    @ApiProperty({ type: StoreReviewPageInfoDto })
    pageInfo!: StoreReviewPageInfoDto;
}
