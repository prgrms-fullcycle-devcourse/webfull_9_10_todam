/// <reference types="jest" />
import { RegisterNotificationTokenUseCase } from './register-notification-token.use-case';
import type { NotificationTokenRow } from '../../domain/repositories/notification-token.repository';

const USER_ID = 'eb50a73f-785f-49ce-887b-5f0bba67a1e3';
const FCM_TOKEN = 'fcm-token-abc123';
const TOKEN_ID = 'aa000000-0000-0000-0000-000000000001';

function makeTokenRow(overrides: Partial<NotificationTokenRow> = {}): NotificationTokenRow {
    return {
        id: TOKEN_ID,
        userId: USER_ID,
        fcmToken: FCM_TOKEN,
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2026-06-11T00:00:00.000Z'),
        revokedAt: null,
        ...overrides,
    };
}

describe('RegisterNotificationTokenUseCase', () => {
    const upsert = jest.fn();
    const revoke = jest.fn();
    const useCase = new RegisterNotificationTokenUseCase({
        upsert,
        revoke,
    } as never);

    beforeEach(() => {
        upsert.mockReset();
        revoke.mockReset();
    });

    it('신규 토큰 등록 — id/userId/fcmToken/createdAt 포함 반환', async () => {
        upsert.mockResolvedValue(makeTokenRow());

        const result = await useCase.execute({
            userId: USER_ID,
            fcmToken: FCM_TOKEN,
            userAgent: 'Mozilla/5.0',
        });

        expect(upsert).toHaveBeenCalledWith({
            userId: USER_ID,
            fcmToken: FCM_TOKEN,
            userAgent: 'Mozilla/5.0',
        });
        expect(result.token.id).toBe(TOKEN_ID);
        expect(result.token.userId).toBe(USER_ID);
        expect(result.token.fcmToken).toBe(FCM_TOKEN);
        expect(result.token.createdAt).toBe('2026-06-11T00:00:00.000Z');
    });

    it('기존 토큰 재등록 — upsert 호출 (갱신)', async () => {
        // revokedAt이 null로 복구된 케이스
        upsert.mockResolvedValue(makeTokenRow({ revokedAt: null }));

        const result = await useCase.execute({
            userId: USER_ID,
            fcmToken: FCM_TOKEN,
        });

        expect(upsert).toHaveBeenCalledTimes(1);
        expect(result.token.userId).toBe(USER_ID);
    });

    it('userAgent 없이 등록 가능 — undefined 전달', async () => {
        upsert.mockResolvedValue(makeTokenRow({ userAgent: null }));

        await useCase.execute({ userId: USER_ID, fcmToken: FCM_TOKEN });

        expect(upsert).toHaveBeenCalledWith({
            userId: USER_ID,
            fcmToken: FCM_TOKEN,
            userAgent: undefined,
        });
    });
});
