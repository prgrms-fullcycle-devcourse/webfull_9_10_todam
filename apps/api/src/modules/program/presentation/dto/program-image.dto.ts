import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class CreateProgramImageDto {
    @ApiProperty({ example: 'program_01.png' })
    @IsString()
    fileName!: string;

    @ApiProperty({ example: 'image/png', description: '지원 형식: JPG, PNG, HEIC' })
    @IsString()
    fileType!: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    isThumbnail!: boolean;
}

export class CreateProgramImageResponseDto {
    @ApiProperty() programImageId!: string;
    @ApiProperty() uploadUrl!: string;
    @ApiProperty() imageUrl!: string;
}
