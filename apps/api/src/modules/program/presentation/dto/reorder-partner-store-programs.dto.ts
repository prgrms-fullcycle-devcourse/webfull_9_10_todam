import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// 클래스 순서 변경 요청 항목: { id, sortOrder }.
export class ReorderPartnerStoreProgramItemDto {
    @ApiProperty({ description: '클래스 ID', example: 'prog-uuid-001' })
    @IsUUID('all', { message: '클래스 ID는 UUID 형식이어야 합니다.' })
    id!: string;

    @ApiProperty({ description: '노출 순서(정수)', example: 1 })
    @IsInt({ message: 'sortOrder는 정수여야 합니다.' })
    sortOrder!: number;
}

// PATCH /partner/stores/{storeId}/programs/order 요청 바디.
// programs[].id 집합은 해당 공방 전체 program 집합과 정확히 일치해야 한다(use-case 에서 검증).
export class ReorderPartnerStoreProgramsDto {
    @ApiProperty({ type: [ReorderPartnerStoreProgramItemDto] })
    @IsArray()
    @ArrayNotEmpty({ message: 'programs 배열은 비어 있을 수 없습니다.' })
    @ValidateNested({ each: true })
    @Type(() => ReorderPartnerStoreProgramItemDto)
    programs!: ReorderPartnerStoreProgramItemDto[];
}
