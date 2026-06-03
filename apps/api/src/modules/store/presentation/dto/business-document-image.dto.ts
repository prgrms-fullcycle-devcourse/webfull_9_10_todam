import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateBusinessDocumentImageDto {
    @ApiProperty({ example: 'business_license.pdf' })
    @IsString()
    fileName!: string;

    @ApiProperty({ example: 'application/pdf' })
    @IsString()
    fileType!: string;
}

export class CreateBusinessDocumentImageResponseDto {
    @ApiProperty() uploadUrl!: string;
    @ApiProperty() documentUrl!: string;
}
