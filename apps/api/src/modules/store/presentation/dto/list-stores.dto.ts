import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Max, Min } from 'class-validator';

// GET /stores 쿼리 파라미터 (전부 선택).
// contract: lat/lng/keyword/cursor/limit — Open decisions #1~#4 + 검색 통합.
export class ListStoresQueryDto {
    @ApiPropertyOptional({
        description: '검색 중심 위도. 위치 권한 거부 시 FE가 성수동 기본값(37.5446) 전송.',
        example: 37.5665,
    })
    @IsOptional()
    @Type(() => Number)
    @IsLatitude({ message: 'lat은 유효한 위도(숫자)여야 합니다.' })
    lat?: number;

    @ApiPropertyOptional({
        description: '검색 중심 경도. 위치 권한 거부 시 FE가 성수동 기본값(127.0560) 전송.',
        example: 126.978,
    })
    @IsOptional()
    @Type(() => Number)
    @IsLongitude({ message: 'lng은 유효한 경도(숫자)여야 합니다.' })
    lng?: number;

    @ApiPropertyOptional({
        description:
            '공방명(name)·주소(address) + ACTIVE 프로그램명(Program.title) 부분일치 검색어.',
        example: '도자기',
    })
    @IsOptional()
    @IsString({ message: 'keyword는 문자열이어야 합니다.' })
    keyword?: string;

    @ApiPropertyOptional({
        description: '다음 페이지 커서(opaque). 첫 페이지는 미전송.',
    })
    @IsOptional()
    @IsString({ message: 'cursor는 문자열이어야 합니다.' })
    cursor?: string;

    @ApiPropertyOptional({
        description: '페이지당 항목 수 (기본 20).',
        example: 20,
        default: 20,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'limit은 정수여야 합니다.' })
    @Min(1, { message: 'limit은 1 이상이어야 합니다.' })
    @Max(100, { message: 'limit은 100 이하여야 합니다.' })
    limit?: number;
}
