/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { RevokeNotificationTokenUseCase } from './revoke-notification-token.use-case';
import type { NotificationTokenRow } from '../../domain/repositories/notification-token.repository';

const USER_ID = 'eb50a73f-785f-49ce-887b-5f0bba67a1e3';
const FCM_TOKEN = 'fcm-token-abc123';
const TOKEN_ID = 'aa000000-0000-0000-0000-000000000001';

function makeTokenRow(overrides: Partial<NotificationTokenRow> = {}): NotificationTokenRow {
    return {
        id: TOKEN_ID,
        userId: USER_ID,
        fcmToken: FCM_TOKEN,
        userAgent: null,
        createdAt: new Date('2026-06-11T00:00:00.000Z'),
        revokedAt: new Date('2026-06-11T01:00:00.000Z'),
        ...overrides,
    };
}

describe('RevokeNotificationTokenUseCase', () => {
    const upsert = jest.fn();
    const revoke = jest.fn();
    const useCase = new RevokeNotificationTokenUseCase({
        upsert,
        revoke,
    } as never);

    beforeEach(() => {
        upsert.mockReset();
        revoke.mockReset();
    });

    it('본인 토큰 revoke 성공 — void 반환', async () => {
        revoke.mockResolvedValue(makeTokenRow());

        await expect(
            useCase.execute({ userId: USER_ID, fcmToken: FCM_TOKEN }),
        ).resolves.toBeUndefined();

        expect(revoke).toHaveBeenCalledWith({ userId: USER_ID, fcmToken: FCM_TOKEN });
    });

    it('존재하지 않는 토큰 — 404 NOTIFICATION_TOKEN_NOT_FOUND', async () => {
        revoke.mockResolvedValue(null);

        const err = await useCase
            .execute({ userId: USER_ID, fcmToken: FCM_TOKEN })
            .catch((e: BusinessException) => e);

        expect((err as BusinessException).errorCode).toBe('NOTIFICATION_TOKEN_NOT_FOUND');
        expect((err as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('타인 토큰(userId 불일치) — repository가 null 반환 → 404', async () => {
        // repository에서 userId+fcmToken 조합으로 조회하므로 타인 토큰은 null 반환됨
        revoke.mockResolvedValue(null);

        const err = await useCase
            .execute({ userId: 'other-user-id', fcmToken: FCM_TOKEN })
            .catch((e: BusinessException) => e);

        expect((err as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
});
