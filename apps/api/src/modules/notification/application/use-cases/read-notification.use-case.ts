import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { NotificationRepository } from '../../domain/repositories/notification.repository';

export interface ReadNotificationResult {
    notification: {
        id: string;
        readAt: string;
    };
}

@Injectable()
export class ReadNotificationUseCase {
    constructor(private readonly notifications: NotificationRepository) {}

    async execute(params: {
        notificationId: string;
        userId: string;
    }): Promise<ReadNotificationResult> {
        const existing = await this.notifications.findById(params.notificationId);

        if (!existing) {
            throw new BusinessException(
                'NOTIFICATION_NOT_FOUND',
                '알림을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 타인 알림 접근 시 403
        if (existing.userId !== params.userId) {
            throw new BusinessException(
                'FORBIDDEN',
                '해당 알림에 대한 접근 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        const updated = await this.notifications.markRead(params.notificationId);

        return {
            notification: {
                id: updated.id,
                // markRead always sets readAt to non-null
                readAt: updated.readAt!.toISOString(),
            },
        };
    }
}
