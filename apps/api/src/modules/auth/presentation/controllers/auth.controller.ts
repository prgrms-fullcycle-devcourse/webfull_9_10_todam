import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SendEmailCodeUseCase } from '../../application/use-cases/send-email-code.use-case';
import { VerifyEmailCodeUseCase } from '../../application/use-cases/verify-email-code.use-case';
import { SendCodeDto } from '../dto/send-code.dto';
import { VerifyCodeDto } from '../dto/verify-code.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly sendEmailCode: SendEmailCodeUseCase,
        private readonly verifyEmailCode: VerifyEmailCodeUseCase,
    ) {}

    @Post('email/send-code')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ description: '인증코드 발송 성공' })
    async sendCode(@Body() dto: SendCodeDto): Promise<void> {
        await this.sendEmailCode.execute(dto.email);
    }

    @Post('email/verify-code')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ description: '인증코드 확인 성공' })
    async verifyCode(@Body() dto: VerifyCodeDto): Promise<void> {
        await this.verifyEmailCode.execute(dto.email, dto.code);
    }
}
