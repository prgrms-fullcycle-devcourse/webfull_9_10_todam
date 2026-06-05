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

export class CreateProgramDto {
    @ApiProperty({ example: '물레 체험 기초반', minLength: 2, maxLength: 60 })
    @IsString()
    @MinLength(2, { message: '클래스명은 2자 이상이어야 합니다.' })
    @MaxLength(60, { message: '클래스명은 60자 이하여야 합니다.' })
    title!: string;

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

    @ApiPropertyOptional({ example: '체험 당일 취소는 불가합니다.' })
    @IsOptional()
    @IsString()
    caution?: string | null;

    @ApiProperty({ example: 45000, description: '양의 정수 (원 단위)' })
    @IsInt({ message: '가격은 정수여야 합니다.' })
    @IsPositive({ message: '가격은 양의 정수여야 합니다.' })
    price!: number;

    @ApiProperty({ example: 120, description: '30~480분' })
    @IsInt({ message: '소요시간은 정수여야 합니다.' })
    @Min(30, { message: '소요시간은 30분 이상이어야 합니다.' })
    @Max(480, { message: '소요시간은 480분 이하여야 합니다.' })
    durationMinutes!: number;

    @ApiProperty({ enum: DIFFICULTY_VALUES, example: 'BASIC' })
    @IsIn(DIFFICULTY_VALUES, {
        message: '난이도는 BASIC, INTERMEDIATE, ADVANCED 중 하나여야 합니다.',
    })
    difficulty!: (typeof DIFFICULTY_VALUES)[number];

    @ApiProperty({ example: false, description: '어린이 동반 가능 여부' })
    @IsBoolean()
    childFriendly!: boolean;

    @ApiProperty({ example: 30, description: '0일 이상' })
    @IsInt({ message: '리드타임은 정수여야 합니다.' })
    @Min(0, { message: '리드타임은 0일 이상이어야 합니다.' })
    leadTimeDays!: number;

    @ApiProperty({ example: true, description: '택배 가능 여부' })
    @IsBoolean()
    deliverable!: boolean;
}

export class CreateProgramResponseProgramDto {
    @ApiProperty() id!: string;
    @ApiProperty() storeId!: string;
    @ApiProperty() title!: string;
    @ApiProperty() status!: string;
    @ApiProperty() createdAt!: string;
}

export class CreateProgramResponseDto {
    @ApiProperty({ type: CreateProgramResponseProgramDto })
    program!: CreateProgramResponseProgramDto;
}
