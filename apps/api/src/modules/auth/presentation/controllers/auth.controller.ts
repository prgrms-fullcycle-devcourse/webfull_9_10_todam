import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { SendEmailCodeUseCase } from '../../application/use-cases/send-email-code.use-case';
import { SignupUseCase } from '../../application/use-cases/signup.use-case';
import { VerifyEmailCodeUseCase } from '../../application/use-cases/verify-email-code.use-case';
import { SendCodeDto } from '../dto/send-code.dto';
import { SignupDto, SignupResponseDto } from '../dto/signup.dto';
import { VerifyCodeDto } from '../dto/verify-code.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly sendEmailCode: SendEmailCodeUseCase,
        private readonly verifyEmailCode: VerifyEmailCodeUseCase,
        private readonly signupUseCase: SignupUseCase,
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

    @Post('signup')
    @ApiCreatedResponse({ description: '회원가입 성공', type: SignupResponseDto })
    async signup(
        @Body() dto: SignupDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<SignupResponseDto> {
        return this.signupUseCase.execute(dto, res);
    }
}
