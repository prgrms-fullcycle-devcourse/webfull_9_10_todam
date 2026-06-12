/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { ReadNotificationUseCase } from './read-notification.use-case';
import type { NotificationRow } from '../../domain/repositories/notification.repository';

const USER_ID = 'eb50a73f-785f-49ce-887b-5f0bba67a1e3';
const OTHER_USER_ID = 'cc000000-0000-0000-0000-000000000099';
const NOTIF_ID = 'aa000000-0000-0000-0000-000000000001';

function makeRow(overrides: Partial<NotificationRow> = {}): NotificationRow {
    return {
        id: NOTIF_ID,
        userId: USER_ID,
        eventType: 'U-ARTWORK_STATUS',
        category: 'ARTWORK',
        title: 'Artwork update',
        body: 'Your artwork status has been updated.',
        deepLink: '/artworks/abc',
        idempotencyKey: 'U-ARTWORK_STATUS:artwork-1:user-1',
        readAt: null,
        createdAt: new Date('2026-06-11T10:00:00.000Z'),
        ...overrides,
    };
}

describe('ReadNotificationUseCase', () => {
    const listByUser = jest.fn();
    const findById = jest.fn();
    const markRead = jest.fn();
    const markAllRead = jest.fn();
    const useCase = new ReadNotificationUseCase({
        listByUser,
        findById,
        markRead,
        markAllRead,
    } as never);

    beforeEach(() => {
        listByUser.mockReset();
        findById.mockReset();
        markRead.mockReset();
        markAllRead.mockReset();
    });

    it('본인 알림 읽음 처리 — id + readAt 반환', async () => {
        const readAt = new Date('2026-06-11T15:00:00.000Z');
        findById.mockResolvedValue(makeRow());
        markRead.mockResolvedValue(makeRow({ readAt }));

        const result = await useCase.execute({ notificationId: NOTIF_ID, userId: USER_ID });

        expect(findById).toHaveBeenCalledWith(NOTIF_ID);
        expect(markRead).toHaveBeenCalledWith(NOTIF_ID);
        expect(result.notification.id).toBe(NOTIF_ID);
        expect(result.notification.readAt).toBe('2026-06-11T15:00:00.000Z');
    });

    it('존재하지 않는 알림 — 404 NOTIFICATION_NOT_FOUND', async () => {
        findById.mockResolvedValue(null);

        const err = await useCase
            .execute({ notificationId: NOTIF_ID, userId: USER_ID })
            .catch((e: unknown) => e);

        expect((err as BusinessException).errorCode).toBe('NOTIFICATION_NOT_FOUND');
        expect((err as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect(markRead).not.toHaveBeenCalled();
    });

    it('타인 알림 접근 — 403 FORBIDDEN', async () => {
        findById.mockResolvedValue(makeRow({ userId: OTHER_USER_ID }));

        const err = await useCase
            .execute({ notificationId: NOTIF_ID, userId: USER_ID })
            .catch((e: unknown) => e);

        expect((err as BusinessException).errorCode).toBe('FORBIDDEN');
        expect((err as BusinessException).getStatus()).toBe(HttpStatus.FORBIDDEN);
        expect(markRead).not.toHaveBeenCalled();
    });
});
