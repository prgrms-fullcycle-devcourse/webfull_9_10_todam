import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsEmail,
    IsIn,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const DAY_OF_WEEK_VALUES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const BUSINESS_NUMBER_PATTERN = /^\d{10}$/;

export class ConvenienceInfoDto {
    @ApiProperty() @IsBoolean() parking!: boolean;
    @ApiProperty() @IsBoolean() pet!: boolean;
    @ApiProperty() @IsBoolean() wifi!: boolean;
}

export class OperatingHourDto {
    @ApiProperty({ enum: DAY_OF_WEEK_VALUES })
    @IsIn(DAY_OF_WEEK_VALUES)
    dayOfWeek!: string;

    @ApiProperty({ example: '10:00' })
    @IsString()
    @Matches(TIME_PATTERN, { message: 'openTime은 HH:mm 형식이어야 합니다.' })
    openTime!: string;

    @ApiProperty({ example: '19:00' })
    @IsString()
    @Matches(TIME_PATTERN, { message: 'closeTime은 HH:mm 형식이어야 합니다.' })
    closeTime!: string;

    @ApiPropertyOptional({ example: '13:00' })
    @IsOptional()
    @IsString()
    @Matches(TIME_PATTERN, { message: 'breakStart는 HH:mm 형식이어야 합니다.' })
    breakStart?: string | null;

    @ApiPropertyOptional({ example: '14:00' })
    @IsOptional()
    @IsString()
    @Matches(TIME_PATTERN, { message: 'breakEnd는 HH:mm 형식이어야 합니다.' })
    breakEnd?: string | null;
}

export class BusinessDocumentDto {
    @ApiProperty({ example: '5555555555', description: '하이픈 없이 숫자 10자리' })
    @IsString()
    @Matches(BUSINESS_NUMBER_PATTERN, {
        message: '사업자등록번호는 하이픈 없이 숫자 10자리여야 합니다.',
    })
    businessNumber!: string;

    @ApiProperty({ example: '흙담' })
    @IsString()
    @MaxLength(200)
    businessName!: string;

    @ApiProperty({ example: '김리듬' })
    @IsString()
    @MaxLength(100)
    ownerName!: string;

    @ApiProperty({ example: '서울특별시 성동구 둑섬로 273(성수동)' })
    @IsString()
    @MaxLength(500)
    businessAddress!: string;

    @ApiPropertyOptional({ example: 'leadem@studio.com' })
    @IsOptional()
    @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
    @MaxLength(255)
    email?: string;
}

export class CreateStoreDto {
    @ApiProperty({ example: '토담 공방', minLength: 2, maxLength: 40 })
    @IsString()
    @MinLength(2, { message: '공방명은 2자 이상이어야 합니다.' })
    @MaxLength(40, { message: '공방명은 40자 이하여야 합니다.' })
    name!: string;

    @ApiPropertyOptional({
        example: 'todam-studio',
        description: '영문 소문자·숫자·하이픈, 4~40자. 미입력 시 자동 생성.',
    })
    @IsOptional()
    @IsString()
    @Matches(/^[a-z0-9-]{4,40}$/, { message: 'slug는 영문 소문자·숫자·하이픈, 4~40자여야 합니다.' })
    slug?: string;

    @ApiPropertyOptional({ example: '흙과 함께하는 도자기 체험 공방입니다.', maxLength: 1000 })
    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: '공방 소개는 1000자 이하여야 합니다.' })
    description?: string | null;

    @ApiProperty({ example: '02-1234-5678' })
    @IsString()
    phone!: string;

    @ApiProperty({ example: '서울특별시 성동구 성수이로 12길 34' })
    @IsString()
    address!: string;

    @ApiProperty({ example: 37.5446 })
    @IsNumber()
    latitude!: number;

    @ApiProperty({ example: 127.0556 })
    @IsNumber()
    longitude!: number;

    @ApiProperty({ type: ConvenienceInfoDto })
    @ValidateNested()
    @Type(() => ConvenienceInfoDto)
    convenienceInfo!: ConvenienceInfoDto;

    @ApiProperty({ example: false })
    @IsBoolean()
    autoConfirm!: boolean;

    @ApiProperty({ example: 1 })
    @IsNumber()
    cancelDeadlineDays!: number;

    @ApiProperty({ type: [OperatingHourDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OperatingHourDto)
    operatingHours!: OperatingHourDto[];

    @ApiProperty({ type: BusinessDocumentDto })
    @ValidateNested()
    @Type(() => BusinessDocumentDto)
    businessDocument!: BusinessDocumentDto;
}

export class CreateStoreResponseStoreDto {
    @ApiProperty() id!: string;
    @ApiProperty() partnerId!: string;
    @ApiProperty() name!: string;
    @ApiProperty() slug!: string;
    @ApiProperty() status!: string;
    @ApiProperty() createdAt!: string;
}

export class CreateStoreResponseDto {
    @ApiProperty({ type: CreateStoreResponseStoreDto }) store!: CreateStoreResponseStoreDto;
}
