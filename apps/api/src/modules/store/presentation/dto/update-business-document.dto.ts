import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
    ValidateIf,
} from 'class-validator';

// shared runtime import는 API Jest ESM 변환 설정 정비 전까지 사용할 수 없다.
const BUSINESS_NUMBER_PATTERN = /^\d{3}-\d{2}-\d{5}$/;

export class UpdateBusinessDocumentDto {
    @ApiPropertyOptional({ example: '555-55-55555', description: '하이픈 포함 형식(000-00-00000)' })
    @IsOptional()
    @IsString()
    @Matches(BUSINESS_NUMBER_PATTERN, {
        message: '사업자등록번호 형식(000-00-00000)이 아닙니다.',
    })
    businessNumber?: string;

    @ApiPropertyOptional({ example: '흙담' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    businessName?: string;

    @ApiPropertyOptional({ example: '김리듬' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    ownerName?: string;

    @ApiPropertyOptional({ example: '서울특별시 성동구 둑섬로 273(성수동)' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(500)
    businessAddress?: string;

    @ApiPropertyOptional({ example: 'leadem@studio.com' })
    @IsOptional()
    @IsEmail({}, { message: '이메일 형식이 아닙니다.' })
    @MaxLength(255)
    email?: string;

    @ApiPropertyOptional({
        example:
            'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/business-documents/uuid.pdf',
        description: '사업자등록증 파일 S3 URL. null 전달 시 파일 제거.',
        nullable: true,
    })
    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @IsString()
    documentUrl?: string | null;
}

export class UpdateBusinessDocumentResultStoreDto {
    @ApiProperty() id!: string;
    @ApiProperty() status!: string;
    @ApiProperty() updatedAt!: string;
}

export class UpdateBusinessDocumentResponseDto {
    @ApiProperty({ type: UpdateBusinessDocumentResultStoreDto })
    store!: UpdateBusinessDocumentResultStoreDto;
}
