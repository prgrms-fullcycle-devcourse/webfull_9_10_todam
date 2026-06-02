import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResetPasswordRequestDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail({}, { message: '유효한 이메일을 입력해주세요.' })
    email!: string;
}
