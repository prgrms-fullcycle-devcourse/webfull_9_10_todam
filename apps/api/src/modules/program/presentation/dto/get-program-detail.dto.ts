import { ApiProperty } from '@nestjs/swagger';

const DIFFICULTY_VALUES = ['BASIC', 'INTERMEDIATE', 'ADVANCED'] as const;
const STATUS_VALUES = ['DRAFT', 'ACTIVE', 'INACTIVE'] as const;

export class ProgramDetailImageDto {
    @ApiProperty() imageUrl!: string;
    @ApiProperty({ type: String, nullable: true }) thumbnailUrl!: string | null;
    // 파트너 상세에서만 포함(편집 화면 이미지 삭제·대표지정용). 퍼블릭 상세는 생략.
    @ApiProperty({ required: false }) programImageId?: string;
    @ApiProperty({ required: false }) isThumbnail?: boolean;
}

export class ProgramDetailDto {
    @ApiProperty() id!: string;
    @ApiProperty() storeId!: string;
    @ApiProperty() title!: string;
    @ApiProperty({ type: String, nullable: true }) description!: string | null;
    @ApiProperty({ type: String, nullable: true }) materials!: string | null;
    @ApiProperty({ type: String, nullable: true }) caution!: string | null;
    @ApiProperty() price!: number;
    @ApiProperty() durationMinutes!: number;
    // 퍼블릭 상세에서만 포함(정원 = Store.maxCapacityPerSlot, 공방 단위). 파트너 상세는 생략.
    @ApiProperty({ type: Number, required: false, nullable: true }) capacity?: number | null;
    @ApiProperty() leadTimeDays!: number;
    @ApiProperty() deliverable!: boolean;
    @ApiProperty() childFriendly!: boolean;
    @ApiProperty({ enum: DIFFICULTY_VALUES }) difficulty!: (typeof DIFFICULTY_VALUES)[number];
    @ApiProperty({ enum: STATUS_VALUES }) status!: (typeof STATUS_VALUES)[number];
    @ApiProperty({ type: [ProgramDetailImageDto] }) images!: ProgramDetailImageDto[];
}

export class GetProgramDetailResponseDto {
    @ApiProperty({ type: ProgramDetailDto })
    program!: ProgramDetailDto;
}
