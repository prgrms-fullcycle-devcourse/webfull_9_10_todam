import { Injectable } from '@nestjs/common';
import { NotificationSettingRepository } from '../../domain/repositories/notification-setting.repository';
import type { GetNotificationSettingsResponseDto } from '../../presentation/dto/notification-settings.dto';

@Injectable()
export class GetNotificationSettingsUseCase {
    constructor(private readonly settings: NotificationSettingRepository) {}

    async execute(userId: string): Promise<GetNotificationSettingsResponseDto> {
        // 레코드 없으면 기본값으로 생성 후 반환 (lazy-default)
        const row = await this.settings.findOrCreateByUserId(userId);

        return {
            notificationSettings: {
                id: row.id,
                userId: row.userId,
                inAppEnabled: row.inAppEnabled,
                emailEnabled: row.emailEnabled,
                kakaoEnabled: row.kakaoEnabled,
                webPushEnabled: row.webPushEnabled,
                reservationEnabled: row.reservationEnabled,
                artworkEnabled: row.artworkEnabled,
                shippingEnabled: row.shippingEnabled,
                marketingEnabled: row.marketingEnabled,
                updatedAt: row.updatedAt.toISOString(),
            },
        };
    }
}
