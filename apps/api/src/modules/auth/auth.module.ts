import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PartnerGuard } from '../../common/guards/partner.guard';
import { TokenService } from './application/token.service';
import { OAuthService } from './application/oauth.service';
import { GoogleOAuthUseCase } from './application/use-cases/google-oauth.use-case';
import { KakaoOAuthUseCase } from './application/use-cases/kakao-oauth.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshUseCase } from './application/use-cases/refresh.use-case';
import { ResetPasswordRequestUseCase } from './application/use-cases/reset-password-request.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { SendEmailCodeUseCase } from './application/use-cases/send-email-code.use-case';
import { SignupUseCase } from './application/use-cases/signup.use-case';
import { VerifyEmailCodeUseCase } from './application/use-cases/verify-email-code.use-case';
import { EmailService } from './infrastructure/email/email.service';
import { JwtAccessStrategy } from './infrastructure/strategies/jwt-access.strategy';
import { UserRepository } from './domain/repositories/user.repository';
import { RefreshTokenRepository } from './domain/repositories/refresh-token.repository';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/prisma-refresh-token.repository';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            useFactory: () => ({
                secret: process.env['JWT_ACCESS_SECRET'],
                signOptions: { expiresIn: '1h' },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        JwtAccessStrategy,
        AuthGuard,
        PartnerGuard,
        TokenService,
        EmailService,
        SendEmailCodeUseCase,
        VerifyEmailCodeUseCase,
        SignupUseCase,
        LoginUseCase,
        RefreshUseCase,
        LogoutUseCase,
        ResetPasswordRequestUseCase,
        ResetPasswordUseCase,
        OAuthService,
        KakaoOAuthUseCase,
        GoogleOAuthUseCase,
        // 포트 → Prisma 어댑터 바인딩(추상 클래스 토큰).
        { provide: UserRepository, useClass: PrismaUserRepository },
        { provide: RefreshTokenRepository, useClass: PrismaRefreshTokenRepository },
    ],
    exports: [JwtModule, AuthGuard, PartnerGuard],
})
export class AuthModule {}
