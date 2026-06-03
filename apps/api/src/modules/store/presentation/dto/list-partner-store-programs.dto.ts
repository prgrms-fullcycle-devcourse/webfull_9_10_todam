import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProgramStatus } from '@prisma/client';

export class PartnerStoreProgramListItemDto {
    @ApiProperty({ description: '클래스 ID', example: 'prog-uuid-001' })
    id!: string;

    @ApiProperty({ description: '클래스명', example: '도자기 물레 원데이 클래스' })
    title!: string;

    @ApiProperty({
        description: '클래스 상태',
        enum: ProgramStatus,
        example: ProgramStatus.ACTIVE,
    })
    status!: ProgramStatus;

    @ApiPropertyOptional({
        description: '대표 썸네일 URL',
        example: 'https://cdn.todam.app/programs/prog-001_thumb.jpg',
        nullable: true,
    })
    thumbnailUrl!: string | null;

    @ApiProperty({ description: '가격(원)', example: 45000 })
    price!: number;

    @ApiProperty({ description: '소요 시간(분)', example: 120 })
    durationMinutes!: number;

    @ApiProperty({ description: '생성 일시 (ISO8601)', example: '2026-05-19T09:00:00.000Z' })
    createdAt!: string;
}

export class ListPartnerStoreProgramsResponseDto {
    @ApiProperty({ type: [PartnerStoreProgramListItemDto] })
    programs!: PartnerStoreProgramListItemDto[];
}
