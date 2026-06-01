import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class CreateStoreImageDto {
    @ApiProperty({ example: 'workshop_main.jpg' })
    @IsString()
    fileName!: string;

    @ApiProperty({ example: 'image/jpeg' })
    @IsString()
    fileType!: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    isThumbnail!: boolean;
}

export class CreateStoreImageResponseDto {
    @ApiProperty() imageId!: string;
    @ApiProperty() uploadUrl!: string;
    @ApiProperty() imageUrl!: string;
}
