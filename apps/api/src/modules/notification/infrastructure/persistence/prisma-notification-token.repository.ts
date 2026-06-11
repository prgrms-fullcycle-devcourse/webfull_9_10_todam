import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
    NotificationTokenRepository,
    NotificationTokenRow,
} from '../../domain/repositories/notification-token.repository';

@Injectable()
export class PrismaNotificationTokenRepository extends NotificationTokenRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async upsert(params: {
        userId: string;
        fcmToken: string;
        userAgent?: string;
    }): Promise<NotificationTokenRow> {
        // 동일 (userId, fcmToken) 레코드가 이미 존재하면 revokedAt=null 복구 + userAgent 갱신.
        // 없으면 신규 생성.
        const row = await this.prisma.notificationToken.upsert({
            where: {
                userId_fcmToken: {
                    userId: params.userId,
                    fcmToken: params.fcmToken,
                },
            },
            create: {
                userId: params.userId,
                fcmToken: params.fcmToken,
                userAgent: params.userAgent ?? null,
            },
            update: {
                revokedAt: null,
                userAgent: params.userAgent ?? null,
            },
        });

        return {
            id: row.id,
            userId: row.userId,
            fcmToken: row.fcmToken,
            userAgent: row.userAgent,
            createdAt: row.createdAt,
            revokedAt: row.revokedAt,
        };
    }

    async revoke(params: {
        userId: string;
        fcmToken: string;
    }): Promise<NotificationTokenRow | null> {
        // 본인 소유 토큰만 revoke. 존재하지 않으면 null.
        const existing = await this.prisma.notificationToken.findUnique({
            where: {
                userId_fcmToken: {
                    userId: params.userId,
                    fcmToken: params.fcmToken,
                },
            },
        });

        if (!existing) return null;

        const row = await this.prisma.notificationToken.update({
            where: {
                userId_fcmToken: {
                    userId: params.userId,
                    fcmToken: params.fcmToken,
                },
            },
            data: { revokedAt: new Date() },
        });

        return {
            id: row.id,
            userId: row.userId,
            fcmToken: row.fcmToken,
            userAgent: row.userAgent,
            createdAt: row.createdAt,
            revokedAt: row.revokedAt,
        };
    }
}
