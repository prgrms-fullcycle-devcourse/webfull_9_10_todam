import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
// Phase 2: FCM 토큰 관리
import { RegisterNotificationTokenUseCase } from './application/use-cases/register-notification-token.use-case';
import { RevokeNotificationTokenUseCase } from './application/use-cases/revoke-notification-token.use-case';
import { NotificationTokenRepository } from './domain/repositories/notification-token.repository';
import { PrismaNotificationTokenRepository } from './infrastructure/persistence/prisma-notification-token.repository';
// Phase 3a: 인앱 알림센터
import { GetNotificationsUseCase } from './application/use-cases/get-notifications.use-case';
import { ReadNotificationUseCase } from './application/use-cases/read-notification.use-case';
import { ReadAllNotificationsUseCase } from './application/use-cases/read-all-notifications.use-case';
import { NotificationRepository } from './domain/repositories/notification.repository';
import { PrismaNotificationRepository } from './infrastructure/persistence/prisma-notification.repository';
import { NotificationController } from './presentation/controllers/notification.controller';

// POST /notifications/tokens — FCM 토큰 등록/갱신 (upsert)
// DELETE /notifications/tokens/:fcmToken — FCM 토큰 revoke
// GET /notifications — 인앱 알림 목록 (커서 페이지네이션)
// PATCH /notifications/:id/read — 단건 읽음 처리
// PATCH /notifications/read-all — 전체 읽음 일괄 처리
// DatabaseModule은 @Global() 이므로 PrismaService 별도 import 불필요.
@Module({
    imports: [AuthModule],
    controllers: [NotificationController],
    providers: [
        // Phase 2
        RegisterNotificationTokenUseCase,
        RevokeNotificationTokenUseCase,
        { provide: NotificationTokenRepository, useClass: PrismaNotificationTokenRepository },
        // Phase 3a
        GetNotificationsUseCase,
        ReadNotificationUseCase,
        ReadAllNotificationsUseCase,
        { provide: NotificationRepository, useClass: PrismaNotificationRepository },
    ],
})
export class NotificationModule {}
