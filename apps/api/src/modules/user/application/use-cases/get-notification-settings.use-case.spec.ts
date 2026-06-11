/// <reference types="jest" />
import { GetNotificationSettingsUseCase } from './get-notification-settings.use-case';
import type { NotificationSettingRow } from '../../domain/repositories/notification-setting.repository';

const USER_ID = 'eb50a73f-785f-49ce-887b-5f0bba67a1e3';
const SETTING_ID = 'bb000000-0000-0000-0000-000000000001';

function makeSettingRow(overrides: Partial<NotificationSettingRow> = {}): NotificationSettingRow {
    return {
        id: SETTING_ID,
        userId: USER_ID,
        inAppEnabled: true,
        emailEnabled: true,
        kakaoEnabled: false,
        webPushEnabled: true,
        reservationEnabled: true,
        artworkEnabled: true,
        shippingEnabled: true,
        marketingEnabled: false,
        updatedAt: new Date('2026-06-11T00:00:00.000Z'),
        ...overrides,
    };
}

describe('GetNotificationSettingsUseCase', () => {
    const findOrCreateByUserId = jest.fn();
    const upsertPatch = jest.fn();
    const useCase = new GetNotificationSettingsUseCase({
        findOrCreateByUserId,
        upsertPatch,
    } as never);

    beforeEach(() => {
        findOrCreateByUserId.mockReset();
        upsertPatch.mockReset();
    });

    it('200: 기존 설정 반환 — 8필드 + webPushEnabled 포함', async () => {
        findOrCreateByUserId.mockResolvedValue(makeSettingRow());

        const result = await useCase.execute(USER_ID);

        expect(result.notificationSettings.id).toBe(SETTING_ID);
        expect(result.notificationSettings.userId).toBe(USER_ID);
        expect(result.notificationSettings.webPushEnabled).toBe(true);
        expect(result.notificationSettings.inAppEnabled).toBe(true);
        expect(result.notificationSettings.marketingEnabled).toBe(false);
        expect(result.notificationSettings.updatedAt).toBe('2026-06-11T00:00:00.000Z');
    });

    it('레코드 없으면 lazy-default로 생성 후 반환 — findOrCreateByUserId 호출됨', async () => {
        findOrCreateByUserId.mockResolvedValue(
            makeSettingRow({ webPushEnabled: true, kakaoEnabled: false }),
        );

        const result = await useCase.execute(USER_ID);

        expect(findOrCreateByUserId).toHaveBeenCalledWith(USER_ID);
        expect(result.notificationSettings.webPushEnabled).toBe(true);
    });

    it('webPushEnabled=false 레코드도 정상 반환', async () => {
        findOrCreateByUserId.mockResolvedValue(makeSettingRow({ webPushEnabled: false }));

        const result = await useCase.execute(USER_ID);

        expect(result.notificationSettings.webPushEnabled).toBe(false);
    });
});
