import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GetMyProfileUseCase } from './application/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from './application/use-cases/update-my-profile.use-case';
import { WithdrawUseCase } from './application/use-cases/withdraw.use-case';
import { GetNotificationSettingsUseCase } from './application/use-cases/get-notification-settings.use-case';
import { PatchNotificationSettingsUseCase } from './application/use-cases/patch-notification-settings.use-case';
import { UserRepository } from './domain/repositories/user.repository';
import { NotificationSettingRepository } from './domain/repositories/notification-setting.repository';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { PrismaNotificationSettingRepository } from './infrastructure/persistence/prisma-notification-setting.repository';
import { UserController } from './presentation/controllers/user.controller';

@Module({
    imports: [AuthModule],
    controllers: [UserController],
    providers: [
        GetMyProfileUseCase,
        UpdateMyProfileUseCase,
        WithdrawUseCase,
        GetNotificationSettingsUseCase,
        PatchNotificationSettingsUseCase,
        { provide: UserRepository, useClass: PrismaUserRepository },
        { provide: NotificationSettingRepository, useClass: PrismaNotificationSettingRepository },
    ],
})
export class UserModule {}
