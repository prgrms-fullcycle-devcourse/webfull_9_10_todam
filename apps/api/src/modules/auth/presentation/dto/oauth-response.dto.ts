import { ApiProperty } from '@nestjs/swagger';

export class OAuthUserDto {
    @ApiProperty() userId!: string;
    @ApiProperty() email!: string;
    @ApiProperty() nickname!: string;
    @ApiProperty() isPartner!: boolean;
}

export class OAuthResponseDto {
    @ApiProperty() accessToken!: string;
    @ApiProperty({ type: OAuthUserDto }) user!: OAuthUserDto;
}
