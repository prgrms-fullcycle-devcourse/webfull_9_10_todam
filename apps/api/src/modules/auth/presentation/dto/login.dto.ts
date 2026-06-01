import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail({}, { message: '유효한 이메일을 입력해주세요.' })
    email!: string;

    @ApiProperty({ example: 'password1234' })
    @IsString()
    password!: string;
}

export class LoginUserDto {
    @ApiProperty() userId!: string;
    @ApiProperty() email!: string;
    @ApiProperty() nickname!: string;
    @ApiProperty() isPartner!: boolean;
}

export class LoginResponseDto {
    @ApiProperty() accessToken!: string;
    @ApiProperty({ type: LoginUserDto }) user!: LoginUserDto;
}
