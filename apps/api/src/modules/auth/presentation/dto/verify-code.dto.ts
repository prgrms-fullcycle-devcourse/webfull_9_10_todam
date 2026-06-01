import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail({}, { message: '유효한 이메일을 입력해주세요.' })
    email!: string;

    @ApiProperty({ example: '482917' })
    @IsString()
    @Length(6, 6, { message: '인증코드는 6자리입니다.' })
    code!: string;
}
