import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// GET /stores/slug-availability 쿼리 파라미터.
// slug 형식(4~40·하이픈만) 검증은 contract의 error:"BAD_REQUEST" 코드를 정확히 맞추기 위해
// use-case(GetSlugAvailabilityUseCase)에서 수행한다. DTO는 타입/Swagger 표기만 담당.
export class SlugAvailabilityQueryDto {
    // 누락·형식위반 모두 use-case에서 BusinessException('BAD_REQUEST')로 처리(contract error 코드 정합).
    // 그래서 DTO 단에서는 optional 타입으로 두어 ValidationPipe의 INVALID_REQUEST 분기를 피한다.
    @ApiProperty({
        description: '중복 확인할 공방 URL slug (영문 소문자·숫자·하이픈, 4~40자).',
        example: 'my-workshop',
    })
    @IsOptional()
    @IsString({ message: 'slug는 문자열이어야 합니다.' })
    slug?: string;

    @ApiPropertyOptional({
        description:
            '수정 화면에서 자기 자신 store를 충돌 검사에서 제외하기 위한 store id. 지정 시 소유권 검증.',
    })
    @IsOptional()
    @IsString({ message: 'excludeStoreId는 문자열이어야 합니다.' })
    excludeStoreId?: string;
}

export class SlugAvailabilityResponseDto {
    @ApiProperty({ example: 'my-workshop', description: '확인 대상 slug' })
    slug!: string;

    @ApiProperty({
        example: true,
        description: '사용 가능 여부 (다른 store가 점유하지 않으면 true)',
    })
    available!: boolean;
}
