import { ApiProperty } from '@nestjs/swagger';
import { ProgramDifficulty, ProgramStatus } from '@prisma/client';

export class StoreProgramListItemDto {
    @ApiProperty({ example: 'prog-uuid-001' })
    id!: string;

    @ApiProperty({ example: '머그컵 만들기', description: '클래스명' })
    title!: string;

    @ApiProperty({
        enum: ProgramDifficulty,
        example: ProgramDifficulty.BASIC,
        description: 'UI 라벨 기본/중급/심화',
    })
    difficulty!: ProgramDifficulty;

    @ApiProperty({ example: '나만의 머그컵을 빚어보는 원데이 클래스', description: '한 줄 설명' })
    description!: string;

    @ApiProperty({ example: 45000, description: '가격(원)' })
    price!: number;

    @ApiProperty({ example: 120, description: '소요 시간(분)' })
    durationMinutes!: number;

    @ApiProperty({ example: 28, description: '작품 수령까지 평균 제작일' })
    leadTimeDays!: number;

    @ApiProperty({ example: true, description: '작품 배송(수령) 가능 여부' })
    deliverable!: boolean;

    @ApiProperty({
        example: 'https://cdn.todam.example/programs/mug-thumb.jpg',
        nullable: true,
        description: '대표 썸네일',
    })
    thumbnailUrl!: string | null;

    @ApiProperty({ enum: ProgramStatus, example: ProgramStatus.ACTIVE, description: '항상 ACTIVE' })
    status!: ProgramStatus;

    @ApiProperty({ example: 1 })
    sortOrder!: number;
}

export class ListStoreProgramsResponseDto {
    @ApiProperty({ type: [StoreProgramListItemDto] })
    programs!: StoreProgramListItemDto[];
}
