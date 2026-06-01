import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail({}, { message: '유효한 이메일을 입력해주세요.' })
    email!: string;

    @ApiProperty({ description: '이메일로 받은 6자리 인증코드' })
    @IsString()
    code!: string;

    @ApiProperty({ example: 'newpassword1234' })
    @IsString()
    @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
    @MaxLength(100)
    newPassword!: string;
}
