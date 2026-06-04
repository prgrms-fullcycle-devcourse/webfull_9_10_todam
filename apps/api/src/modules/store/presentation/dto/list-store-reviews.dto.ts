import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const STORE_REVIEW_SORTS = ['latest', 'rating_high'] as const;
export type StoreReviewSort = (typeof STORE_REVIEW_SORTS)[number];

// GET /stores/:slug/reviews 쿼리 파라미터 (전부 선택).
// contract: cursor(opaque, 첫 페이지 미전송) · limit(기본 10) · sort(latest|rating_high, 기본 latest).
export class ListStoreReviewsQueryDto {
    @ApiPropertyOptional({
        description: '다음 페이지 커서(opaque). 첫 페이지는 미전송.',
    })
    @IsOptional()
    @IsString({ message: 'cursor는 문자열이어야 합니다.' })
    cursor?: string;

    @ApiPropertyOptional({
        description: '페이지당 항목 수 (기본 10).',
        example: 10,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'limit은 정수여야 합니다.' })
    @Min(1, { message: 'limit은 1 이상이어야 합니다.' })
    @Max(100, { message: 'limit은 100 이하여야 합니다.' })
    limit?: number;

    @ApiPropertyOptional({
        description: '정렬 기준. latest(최신순, 기본) | rating_high(별점 높은순).',
        enum: STORE_REVIEW_SORTS,
        default: 'latest',
    })
    @IsOptional()
    @IsIn(STORE_REVIEW_SORTS, {
        message: 'sort는 latest 또는 rating_high여야 합니다.',
    })
    sort?: StoreReviewSort;
}
