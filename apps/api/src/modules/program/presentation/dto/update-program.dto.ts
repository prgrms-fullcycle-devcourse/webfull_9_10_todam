import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsIn,
    IsInt,
    IsOptional,
    IsPositive,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';

const DIFFICULTY_VALUES = ['BASIC', 'INTERMEDIATE', 'ADVANCED'] as const;

// 프로그램 수정 — 모든 필드 optional(partial update). 전송된 필드만 반영된다.
export class UpdateProgramDto {
    @ApiPropertyOptional({ example: '물레 체험 기초반 (개정)', minLength: 2, maxLength: 60 })
    @IsOptional()
    @IsString()
    @MinLength(2, { message: '클래스명은 2자 이상이어야 합니다.' })
    @MaxLength(60, { message: '클래스명은 60자 이하여야 합니다.' })
    title?: string;

    @ApiPropertyOptional({
        example: '처음 도자기를 접하는 분들을 위한 물레 체험입니다.',
        maxLength: 1000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: '상세 설명은 1000자 이하여야 합니다.' })
    description?: string | null;

    @ApiPropertyOptional({ example: '앞치마 (공방 제공), 편한 복장' })
    @IsOptional()
    @IsString()
    materials?: string | null;

    @ApiPropertyOptional({ example: '체험 2시간 전까지 취소 가능합니다.' })
    @IsOptional()
    @IsString()
    caution?: string | null;

    @ApiPropertyOptional({ example: 48000, description: '양의 정수 (원 단위)' })
    @IsOptional()
    @IsInt({ message: '가격은 정수여야 합니다.' })
    @IsPositive({ message: '가격은 양의 정수여야 합니다.' })
    price?: number;

    @ApiPropertyOptional({ example: 30, description: '0일 이상' })
    @IsOptional()
    @IsInt({ message: '리드타임은 정수여야 합니다.' })
    @Min(0, { message: '리드타임은 0일 이상이어야 합니다.' })
    leadTimeDays?: number;

    @ApiPropertyOptional({ example: 120, description: '30~480분' })
    @IsOptional()
    @IsInt({ message: '소요시간은 정수여야 합니다.' })
    @Min(30, { message: '소요시간은 30분 이상이어야 합니다.' })
    @Max(480, { message: '소요시간은 480분 이하여야 합니다.' })
    durationMinutes?: number;

    @ApiPropertyOptional({ enum: DIFFICULTY_VALUES, example: 'BASIC' })
    @IsOptional()
    @IsIn(DIFFICULTY_VALUES, {
        message: '난이도는 BASIC, INTERMEDIATE, ADVANCED 중 하나여야 합니다.',
    })
    difficulty?: (typeof DIFFICULTY_VALUES)[number];

    @ApiPropertyOptional({ example: true, description: '어린이 동반 가능 여부' })
    @IsOptional()
    @IsBoolean()
    childFriendly?: boolean;

    @ApiPropertyOptional({ example: false, description: '택배 배송 가능 여부' })
    @IsOptional()
    @IsBoolean()
    deliverable?: boolean;
}

export class UpdateProgramResponseProgramDto {
    @ApiProperty() id!: string;
    @ApiProperty() title!: string;
    @ApiProperty() price!: number;
    @ApiProperty() status!: string;
    @ApiProperty() updatedAt!: string;
}

export class UpdateProgramResponseDto {
    @ApiProperty({ type: UpdateProgramResponseProgramDto })
    program!: UpdateProgramResponseProgramDto;
}
