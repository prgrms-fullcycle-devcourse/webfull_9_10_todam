/// <reference types="jest" />
import { PatchNotificationSettingsUseCase } from './patch-notification-settings.use-case';
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

describe('PatchNotificationSettingsUseCase', () => {
    const findOrCreateByUserId = jest.fn();
    const upsertPatch = jest.fn();
    const useCase = new PatchNotificationSettingsUseCase({
        findOrCreateByUserId,
        upsertPatch,
    } as never);

    beforeEach(() => {
        findOrCreateByUserId.mockReset();
        upsertPatch.mockReset();
    });

    it('빈 객체 no-op — upsertPatch 호출됨(patch 전달)', async () => {
        upsertPatch.mockResolvedValue(makeSettingRow());

        const result = await useCase.execute(USER_ID, {});

        expect(upsertPatch).toHaveBeenCalledWith(USER_ID, {
            inAppEnabled: undefined,
            emailEnabled: undefined,
            kakaoEnabled: undefined,
            webPushEnabled: undefined,
            reservationEnabled: undefined,
            artworkEnabled: undefined,
            shippingEnabled: undefined,
            marketingEnabled: undefined,
        });
        expect(result.notificationSettings.webPushEnabled).toBe(true);
    });

    it('webPushEnabled=false로 업데이트', async () => {
        upsertPatch.mockResolvedValue(makeSettingRow({ webPushEnabled: false }));

        const result = await useCase.execute(USER_ID, { webPushEnabled: false });

        expect(result.notificationSettings.webPushEnabled).toBe(false);
    });

    it('partial 업데이트 — artworkEnabled만 변경', async () => {
        upsertPatch.mockResolvedValue(makeSettingRow({ artworkEnabled: false }));

        const result = await useCase.execute(USER_ID, { artworkEnabled: false });

        expect(upsertPatch).toHaveBeenCalledWith(
            USER_ID,
            expect.objectContaining({ artworkEnabled: false }),
        );
        expect(result.notificationSettings.artworkEnabled).toBe(false);
    });

    it('레코드 없을 때 기본값 생성 후 업데이트 — upsertPatch에서 처리', async () => {
        upsertPatch.mockResolvedValue(makeSettingRow({ webPushEnabled: true }));

        const result = await useCase.execute(USER_ID, { webPushEnabled: true });

        expect(result.notificationSettings.webPushEnabled).toBe(true);
    });
});
