import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RegisterNotificationTokenUseCase } from './application/use-cases/register-notification-token.use-case';
import { RevokeNotificationTokenUseCase } from './application/use-cases/revoke-notification-token.use-case';
import { NotificationTokenRepository } from './domain/repositories/notification-token.repository';
import { PrismaNotificationTokenRepository } from './infrastructure/persistence/prisma-notification-token.repository';
import { NotificationController } from './presentation/controllers/notification.controller';

// POST /notifications/tokens — FCM 토큰 등록/갱신 (upsert)
// DELETE /notifications/tokens/:fcmToken — FCM 토큰 revoke
// DatabaseModule은 @Global() 이므로 PrismaService 별도 import 불필요.
@Module({
    imports: [AuthModule],
    controllers: [NotificationController],
    providers: [
        RegisterNotificationTokenUseCase,
        RevokeNotificationTokenUseCase,
        { provide: NotificationTokenRepository, useClass: PrismaNotificationTokenRepository },
    ],
})
export class NotificationModule {}
