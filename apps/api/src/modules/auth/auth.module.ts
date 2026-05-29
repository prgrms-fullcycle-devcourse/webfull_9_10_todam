import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PartnerGuard } from '../../common/guards/partner.guard';
import { JwtAccessStrategy } from './infrastructure/strategies/jwt-access.strategy';

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
    providers: [JwtAccessStrategy, AuthGuard, PartnerGuard],
    exports: [JwtModule, AuthGuard, PartnerGuard],
})
export class AuthModule {}
