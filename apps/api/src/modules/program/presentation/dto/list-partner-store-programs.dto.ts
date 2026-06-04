import { ApiProperty } from '@nestjs/swagger';
import { ProgramDifficulty, ProgramStatus } from '@prisma/client';

export class PartnerStoreProgramListItemDto {
    @ApiProperty({ description: '클래스 ID', example: 'prog-uuid-001' })
    id!: string;

    @ApiProperty({ description: '클래스명', example: '도자기 물레 원데이 클래스' })
    title!: string;

    @ApiProperty({ description: '가격(원)', example: 45000 })
    price!: number;

    @ApiProperty({ description: '소요 시간(분)', example: 120 })
    durationMinutes!: number;

    @ApiProperty({
        description: '난이도',
        enum: ProgramDifficulty,
        example: ProgramDifficulty.BASIC,
    })
    difficulty!: ProgramDifficulty;

    @ApiProperty({ description: '작품 수령까지 평균 제작일', example: 30 })
    leadTimeDays!: number;

    @ApiProperty({
        description: '클래스 상태',
        enum: ProgramStatus,
        example: ProgramStatus.ACTIVE,
    })
    status!: ProgramStatus;
}

export class ListPartnerStoreProgramsResponseDto {
    @ApiProperty({ type: [PartnerStoreProgramListItemDto] })
    programs!: PartnerStoreProgramListItemDto[];
}
