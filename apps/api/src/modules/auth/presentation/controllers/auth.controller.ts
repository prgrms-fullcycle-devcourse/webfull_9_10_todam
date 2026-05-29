import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RefreshUseCase } from '../../application/use-cases/refresh.use-case';
import { ResetPasswordRequestUseCase } from '../../application/use-cases/reset-password-request.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { SendEmailCodeUseCase } from '../../application/use-cases/send-email-code.use-case';
import { SignupUseCase } from '../../application/use-cases/signup.use-case';
import { VerifyEmailCodeUseCase } from '../../application/use-cases/verify-email-code.use-case';
import { LoginDto, LoginResponseDto } from '../dto/login.dto';
import { ResetPasswordRequestDto } from '../dto/reset-password-request.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
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
        private readonly loginUseCase: LoginUseCase,
        private readonly refreshUseCase: RefreshUseCase,
        private readonly logoutUseCase: LogoutUseCase,
        private readonly resetPasswordRequestUseCase: ResetPasswordRequestUseCase,
        private readonly resetPasswordUseCase: ResetPasswordUseCase,
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

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ description: '로그인 성공', type: LoginResponseDto })
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<LoginResponseDto> {
        return this.loginUseCase.execute(dto, res);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ description: 'access token 재발급 성공', type: LoginResponseDto })
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ accessToken: string }> {
        const token = req.cookies['refresh_token'] as string | undefined;
        return this.refreshUseCase.execute(token, res);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ApiOkResponse({ description: '로그아웃 성공' })
    async logout(
        @CurrentUser() user: RequestUser,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<void> {
        const token = req.cookies['refresh_token'] as string | undefined;
        await this.logoutUseCase.execute(user.id, token, res);
    }

    @Post('password/reset-request')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ description: '비밀번호 재설정 이메일 발송 (이메일 존재 여부와 무관하게 200 반환)' })
    async resetPasswordRequest(@Body() dto: ResetPasswordRequestDto): Promise<void> {
        await this.resetPasswordRequestUseCase.execute(dto.email);
    }

    @Post('password/reset')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ description: '비밀번호 재설정 성공' })
    async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
        await this.resetPasswordUseCase.execute(dto);
    }
}
