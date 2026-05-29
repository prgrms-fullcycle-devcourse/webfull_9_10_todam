import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PartnerGuard } from '../../common/guards/partner.guard';
import { TokenService } from './application/token.service';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { SendEmailCodeUseCase } from './application/use-cases/send-email-code.use-case';
import { SignupUseCase } from './application/use-cases/signup.use-case';
import { VerifyEmailCodeUseCase } from './application/use-cases/verify-email-code.use-case';
import { EmailService } from './infrastructure/email/email.service';
import { JwtAccessStrategy } from './infrastructure/strategies/jwt-access.strategy';
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
    ],
    exports: [JwtModule, AuthGuard, PartnerGuard],
})
export class AuthModule {}
