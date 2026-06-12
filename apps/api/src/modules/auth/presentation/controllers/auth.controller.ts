import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    loginRequestSchema,
    oauthCodeRequestSchema,
    passwordResetRequestSchema,
    passwordResetSchema,
    sendCodeRequestSchema,
    signupRequestSchema,
    verifyCodeRequestSchema,
} from '@todam/shared';
import type {
    AccessTokenResponse,
    LoginRequest,
    LoginResponse,
    OAuthCodeRequest,
    OAuthResponse,
    PasswordReset,
    PasswordResetRequest,
    SendCodeRequest,
    SignupRequest,
    SignupResponse,
    VerifyCodeRequest,
} from '@todam/shared';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { GoogleOAuthUseCase } from '../../application/use-cases/google-oauth.use-case';
import { KakaoOAuthUseCase } from '../../application/use-cases/kakao-oauth.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RefreshUseCase } from '../../application/use-cases/refresh.use-case';
import { ResetPasswordRequestUseCase } from '../../application/use-cases/reset-password-request.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { SendEmailCodeUseCase } from '../../application/use-cases/send-email-code.use-case';
import { SignupUseCase } from '../../application/use-cases/signup.use-case';
import { VerifyEmailCodeUseCase } from '../../application/use-cases/verify-email-code.use-case';
import { AccessTokenResponseDto, LoginRequestDto, LoginResponseDto } from '../dto/login.dto';
import { OAuthCodeRequestDto } from '../dto/oauth-code.dto';
import { OAuthResponseDto } from '../dto/oauth-response.dto';
import { PasswordResetRequestDto } from '../dto/reset-password-request.dto';
import { PasswordResetDto } from '../dto/reset-password.dto';
import { SendCodeRequestDto } from '../dto/send-code.dto';
import { SignupRequestDto, SignupResponseDto } from '../dto/signup.dto';
import { VerifyCodeRequestDto } from '../dto/verify-code.dto';

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
        private readonly kakaoOAuthUseCase: KakaoOAuthUseCase,
        private readonly googleOAuthUseCase: GoogleOAuthUseCase,
    ) {}

    @Post('email/send-code')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: SendCodeRequestDto })
    @ApiOkResponse({ description: '인증코드 발송 성공' })
    async sendCode(
        @Body(new ZodValidationPipe(sendCodeRequestSchema)) dto: SendCodeRequest,
    ): Promise<void> {
        await this.sendEmailCode.execute(dto.email);
    }

    @Post('email/verify-code')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: VerifyCodeRequestDto })
    @ApiOkResponse({ description: '인증코드 확인 성공' })
    async verifyCode(
        @Body(new ZodValidationPipe(verifyCodeRequestSchema)) dto: VerifyCodeRequest,
    ): Promise<void> {
        await this.verifyEmailCode.execute(dto.email, dto.code);
    }

    @Post('signup')
    @ApiBody({ type: SignupRequestDto })
    @ApiCreatedResponse({ description: '회원가입 성공', type: SignupResponseDto })
    async signup(
        @Body(new ZodValidationPipe(signupRequestSchema)) dto: SignupRequest,
    ): Promise<SignupResponse> {
        return this.signupUseCase.execute(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: LoginRequestDto })
    @ApiOkResponse({ description: '로그인 성공', type: LoginResponseDto })
    async login(
        @Body(new ZodValidationPipe(loginRequestSchema)) dto: LoginRequest,
        @Res({ passthrough: true }) res: Response,
    ): Promise<LoginResponse> {
        return this.loginUseCase.execute(dto, res);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ description: 'access token 재발급 성공', type: AccessTokenResponseDto })
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<AccessTokenResponse> {
        const token = req.cookies['refresh_token'] as string | undefined;
        return this.refreshUseCase.execute(token, res);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
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
    @ApiBody({ type: PasswordResetRequestDto })
    @ApiOkResponse({
        description: '비밀번호 재설정 이메일 발송 (이메일 존재 여부와 무관하게 200 반환)',
    })
    async resetPasswordRequest(
        @Body(new ZodValidationPipe(passwordResetRequestSchema)) dto: PasswordResetRequest,
    ): Promise<void> {
        await this.resetPasswordRequestUseCase.execute(dto.email);
    }

    @Post('password/reset')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: PasswordResetDto })
    @ApiOkResponse({ description: '비밀번호 재설정 성공' })
    async resetPassword(
        @Body(new ZodValidationPipe(passwordResetSchema)) dto: PasswordReset,
    ): Promise<void> {
        await this.resetPasswordUseCase.execute(dto);
    }

    @Post('oauth/kakao')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: OAuthCodeRequestDto })
    @ApiOkResponse({ description: '카카오 소셜 로그인 성공', type: OAuthResponseDto })
    async kakaoOAuth(
        @Body(new ZodValidationPipe(oauthCodeRequestSchema)) dto: OAuthCodeRequest,
        @Res({ passthrough: true }) res: Response,
    ): Promise<OAuthResponse> {
        return this.kakaoOAuthUseCase.execute(dto.code, res);
    }

    @Post('oauth/google')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: OAuthCodeRequestDto })
    @ApiOkResponse({ description: '구글 소셜 로그인 성공', type: OAuthResponseDto })
    async googleOAuth(
        @Body(new ZodValidationPipe(oauthCodeRequestSchema)) dto: OAuthCodeRequest,
        @Res({ passthrough: true }) res: Response,
    ): Promise<OAuthResponse> {
        return this.googleOAuthUseCase.execute(dto.code, res);
    }
}
