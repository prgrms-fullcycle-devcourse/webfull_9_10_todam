import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminLoginUseCase } from './application/use-cases/admin-login.use-case';
import {
    ApproveStoreUseCase,
    GetAdminStoreDetailUseCase,
    ListAdminStoresUseCase,
    RejectStoreUseCase,
    RestoreStoreUseCase,
    SuspendStoreUseCase,
} from './application/use-cases/admin-store.use-cases';
import { JwtAdminStrategy } from './infrastructure/strategies/jwt-admin.strategy';
import { AdminController } from './presentation/controllers/admin.controller';
import { AdminGuard } from './presentation/guards/admin.guard';

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            useFactory: () => ({
                secret: process.env['JWT_ADMIN_SECRET'],
                signOptions: { expiresIn: '1h' },
            }),
        }),
    ],
    controllers: [AdminController],
    providers: [
        JwtAdminStrategy,
        AdminGuard,
        AdminLoginUseCase,
        ListAdminStoresUseCase,
        GetAdminStoreDetailUseCase,
        ApproveStoreUseCase,
        RejectStoreUseCase,
        SuspendStoreUseCase,
        RestoreStoreUseCase,
    ],
})
export class AdminModule {}
