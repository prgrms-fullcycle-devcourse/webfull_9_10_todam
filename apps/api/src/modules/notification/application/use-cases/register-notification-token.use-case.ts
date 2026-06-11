import { Injectable } from '@nestjs/common';
import { NotificationTokenRepository } from '../../domain/repositories/notification-token.repository';

export interface RegisterNotificationTokenResult {
    token: {
        id: string;
        userId: string;
        fcmToken: string;
        createdAt: string;
    };
}

@Injectable()
export class RegisterNotificationTokenUseCase {
    constructor(private readonly tokens: NotificationTokenRepository) {}

    async execute(params: {
        userId: string;
        fcmToken: string;
        userAgent?: string;
    }): Promise<RegisterNotificationTokenResult> {
        const row = await this.tokens.upsert({
            userId: params.userId,
            fcmToken: params.fcmToken,
            userAgent: params.userAgent,
        });

        return {
            token: {
                id: row.id,
                userId: row.userId,
                fcmToken: row.fcmToken,
                createdAt: row.createdAt.toISOString(),
            },
        };
    }
}
