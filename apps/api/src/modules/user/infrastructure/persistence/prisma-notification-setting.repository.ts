import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
    NotificationSettingPatchInput,
    NotificationSettingRepository,
    NotificationSettingRow,
} from '../../domain/repositories/notification-setting.repository';

/** notification_settings 기본값 (신규 생성 시 적용) */
const DEFAULT_NOTIFICATION_SETTING = {
    inAppEnabled: true,
    emailEnabled: true,
    kakaoEnabled: false,
    webPushEnabled: true, // Web Push 채널 마스터스위치 기본 on (#315)
    reservationEnabled: true,
    artworkEnabled: true,
    shippingEnabled: true,
    marketingEnabled: false,
};

const NOTIFICATION_SETTING_SELECT = {
    id: true,
    userId: true,
    inAppEnabled: true,
    emailEnabled: true,
    kakaoEnabled: true,
    webPushEnabled: true,
    reservationEnabled: true,
    artworkEnabled: true,
    shippingEnabled: true,
    marketingEnabled: true,
    updatedAt: true,
} as const;

function toRow(raw: {
    id: string;
    userId: string;
    inAppEnabled: boolean;
    emailEnabled: boolean;
    kakaoEnabled: boolean;
    webPushEnabled: boolean;
    reservationEnabled: boolean;
    artworkEnabled: boolean;
    shippingEnabled: boolean;
    marketingEnabled: boolean;
    updatedAt: Date;
}): NotificationSettingRow {
    return {
        id: raw.id,
        userId: raw.userId,
        inAppEnabled: raw.inAppEnabled,
        emailEnabled: raw.emailEnabled,
        kakaoEnabled: raw.kakaoEnabled,
        webPushEnabled: raw.webPushEnabled,
        reservationEnabled: raw.reservationEnabled,
        artworkEnabled: raw.artworkEnabled,
        shippingEnabled: raw.shippingEnabled,
        marketingEnabled: raw.marketingEnabled,
        updatedAt: raw.updatedAt,
    };
}

@Injectable()
export class PrismaNotificationSettingRepository extends NotificationSettingRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findOrCreateByUserId(userId: string): Promise<NotificationSettingRow> {
        // upsert: 없으면 기본값으로 생성, 있으면 그대로 반환
        const row = await this.prisma.notificationSetting.upsert({
            where: { userId },
            create: {
                userId,
                ...DEFAULT_NOTIFICATION_SETTING,
            },
            update: {},
            select: NOTIFICATION_SETTING_SELECT,
        });

        return toRow(row);
    }

    async upsertPatch(
        userId: string,
        patch: NotificationSettingPatchInput,
    ): Promise<NotificationSettingRow> {
        const hasAnyField = Object.keys(patch).length > 0;

        if (!hasAnyField) {
            // 빈 객체 — no-op: 레코드 없으면 기본값 생성, 있으면 그대로 반환
            return this.findOrCreateByUserId(userId);
        }

        const row = await this.prisma.notificationSetting.upsert({
            where: { userId },
            create: {
                userId,
                ...DEFAULT_NOTIFICATION_SETTING,
                ...patch,
            },
            update: patch,
            select: NOTIFICATION_SETTING_SELECT,
        });

        return toRow(row);
    }
}
