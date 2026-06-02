import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsIn,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConvenienceInfoDto, OperatingHourDto } from './create-store.dto';

// 공방 정보 수정 DTO. 모든 필드 optional(부분 갱신 — DEC-2).
// operatingHours / images 는 배열 전체 치환(DEC-4 / OD-3).
export class UpdateStoreDto {
    @ApiPropertyOptional({ example: '토담 도자기 공방', minLength: 2, maxLength: 40 })
    @IsOptional()
    @IsString()
    @MinLength(2, { message: '공방명은 2자 이상이어야 합니다.' })
    @MaxLength(40, { message: '공방명은 40자 이하여야 합니다.' })
    name?: string;

    @ApiPropertyOptional({
        example: 'todam-pottery',
        description: '영문 소문자·숫자·하이픈, 4~40자. unique.',
    })
    @IsOptional()
    @IsString()
    @Matches(/^[a-z0-9-]{4,40}$/, {
        message: 'slug는 영문 소문자·숫자·하이픈, 4~40자여야 합니다.',
    })
    slug?: string;

    @ApiPropertyOptional({ example: '새롭게 단장한 토담 공방입니다.', maxLength: 1000 })
    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: '공방 소개는 1000자 이하여야 합니다.' })
    description?: string | null;

    @ApiPropertyOptional({ example: '02-9876-5432' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ type: ConvenienceInfoDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => ConvenienceInfoDto)
    convenienceInfo?: ConvenienceInfoDto;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    autoConfirm?: boolean;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsNumber()
    cancelDeadlineDays?: number;

    @ApiPropertyOptional({
        enum: [60, 90, 120, 180],
        description: '타임슬롯 생성 기준 간격(분). 1/1.5/2/3시간',
    })
    @IsOptional()
    @IsIn([60, 90, 120, 180], {
        message: '예약 시간 간격은 60, 90, 120, 180분 중 하나여야 합니다.',
    })
    reservationIntervalMinutes?: number;

    @ApiPropertyOptional({
        example: 6,
        description: '슬롯당 최대 예약 정원(공방 단위, 클래스 공통)',
    })
    @IsOptional()
    @IsNumber()
    maxCapacityPerSlot?: number;

    @ApiPropertyOptional({
        type: [OperatingHourDto],
        description: '운영시간 배열. 전달 시 전체 치환(DEC-4).',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OperatingHourDto)
    operatingHours?: OperatingHourDto[];

    @ApiPropertyOptional({
        type: [String],
        description: '최종 이미지 id 목록. 전달 시 전체 치환(OD-3).',
    })
    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    images?: string[];
}

export class UpdateStoreResponseStoreDto {
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
    id!: string;

    @ApiProperty({ example: '토담 공방' })
    name!: string;

    @ApiProperty({ example: 'todam-studio' })
    slug!: string;

    @ApiProperty({ example: 'PUBLISHED' })
    status!: string;

    @ApiProperty({ example: '2026-05-25T18:20:00.000Z' })
    updatedAt!: string;
}

export class UpdateStoreResponseDto {
    @ApiProperty({ type: UpdateStoreResponseStoreDto })
    store!: UpdateStoreResponseStoreDto;
}
