import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail({}, { message: '유효한 이메일을 입력해주세요.' })
    email!: string;

    @ApiProperty({ example: 'password1234' })
    @IsString()
    @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
    @MaxLength(100)
    password!: string;

    @ApiProperty({ example: '도예인' })
    @IsString()
    @MinLength(2, { message: '닉네임은 2자 이상이어야 합니다.' })
    @MaxLength(100)
    nickname!: string;
}

export class SignupResponseDto {
    @ApiProperty()
    accessToken!: string;
}
