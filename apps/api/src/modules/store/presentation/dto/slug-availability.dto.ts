import { ApiProperty } from '@nestjs/swagger';
import { slugAvailabilityQuerySchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청 SSOT = @todam/shared(zod). slug 형식(4~40·하이픈) 검증은 contract error
// "BAD_REQUEST" 코드 정합을 위해 use-case(GetSlugAvailabilityUseCase)에서 수행 —
// 스키마는 optional string 으로만 두어 INVALID_REQUEST 분기를 피한다.
export class SlugAvailabilityQueryDto extends createZodDto(slugAvailabilityQuerySchema) {}

export class SlugAvailabilityResponseDto {
    @ApiProperty({ example: 'my-workshop', description: '확인 대상 slug' })
    slug!: string;

    @ApiProperty({
        example: true,
        description: '사용 가능 여부 (다른 store가 점유하지 않으면 true)',
    })
    available!: boolean;
}
