import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class OAuthCodeDto {
    @ApiProperty({ description: '프론트에서 OAuth 제공자로부터 받은 인가 코드' })
    @IsString()
    code!: string;
}
