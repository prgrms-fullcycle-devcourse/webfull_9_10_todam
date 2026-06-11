import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../../domain/repositories/notification.repository';

export interface ReadAllNotificationsResult {
    updatedCount: number;
}

@Injectable()
export class ReadAllNotificationsUseCase {
    constructor(private readonly notifications: NotificationRepository) {}

    async execute(params: { userId: string }): Promise<ReadAllNotificationsResult> {
        const updatedCount = await this.notifications.markAllRead(params.userId);
        return { updatedCount };
    }
}
