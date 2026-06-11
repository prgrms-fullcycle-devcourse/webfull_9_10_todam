import { Injectable } from '@nestjs/common';
import type { PatchNotificationSettingsAllFieldsBody } from '@todam/shared';
import { NotificationSettingRepository } from '../../domain/repositories/notification-setting.repository';
import type { PatchNotificationSettingsResponseDto } from '../../presentation/dto/notification-settings.dto';

@Injectable()
export class PatchNotificationSettingsUseCase {
    constructor(private readonly settings: NotificationSettingRepository) {}

    async execute(
        userId: string,
        body: PatchNotificationSettingsAllFieldsBody,
    ): Promise<PatchNotificationSettingsResponseDto> {
        // 빈 객체면 no-op: 현재 설정 반환 (기존 없으면 기본값 생성).
        // 필드가 있으면 partial 업데이트.
        const row = await this.settings.upsertPatch(userId, {
            inAppEnabled: body.inAppEnabled,
            emailEnabled: body.emailEnabled,
            kakaoEnabled: body.kakaoEnabled,
            webPushEnabled: body.webPushEnabled,
            reservationEnabled: body.reservationEnabled,
            artworkEnabled: body.artworkEnabled,
            shippingEnabled: body.shippingEnabled,
            marketingEnabled: body.marketingEnabled,
        });

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
