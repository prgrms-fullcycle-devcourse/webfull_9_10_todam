/// <reference types="jest" />
import { GetNotificationsUseCase } from './get-notifications.use-case';
import type { NotificationRow } from '../../domain/repositories/notification.repository';

const USER_ID = 'eb50a73f-785f-49ce-887b-5f0bba67a1e3';
const NOTIF_ID_1 = 'aa000000-0000-0000-0000-000000000001';
const NOTIF_ID_2 = 'aa000000-0000-0000-0000-000000000002';

function makeRow(overrides: Partial<NotificationRow> = {}): NotificationRow {
    return {
        id: NOTIF_ID_1,
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

describe('GetNotificationsUseCase', () => {
    const listByUser = jest.fn();
    const findById = jest.fn();
    const markRead = jest.fn();
    const markAllRead = jest.fn();
    const useCase = new GetNotificationsUseCase({
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

    it('알림 목록 조회 — notifications 배열 + nextCursor + unreadCount 반환', async () => {
        const rows = [
            makeRow({ id: NOTIF_ID_1 }),
            makeRow({ id: NOTIF_ID_2, createdAt: new Date('2026-06-11T09:00:00.000Z') }),
        ];
        listByUser.mockResolvedValue({ notifications: rows, unreadCount: 2 });

        const result = await useCase.execute({ userId: USER_ID, limit: 2 });

        expect(listByUser).toHaveBeenCalledWith({
            userId: USER_ID,
            cursor: undefined,
            limit: 2,
            unreadOnly: undefined,
        });
        expect(result.notifications).toHaveLength(2);
        expect(result.notifications[0]!.recipientId).toBe(USER_ID);
        expect(result.notifications[0]!.id).toBe(NOTIF_ID_1);
        expect(result.unreadCount).toBe(2);
        // limit 개 도달 → nextCursor 존재
        expect(result.nextCursor).not.toBeNull();
    });

    it('결과가 limit 미만 — nextCursor=null (마지막 페이지)', async () => {
        listByUser.mockResolvedValue({ notifications: [makeRow()], unreadCount: 0 });

        const result = await useCase.execute({ userId: USER_ID, limit: 20 });

        // 1개 < limit(20) → 마지막 페이지
        expect(result.nextCursor).toBeNull();
    });

    it('unreadOnly=true — listByUser에 unreadOnly 전달', async () => {
        listByUser.mockResolvedValue({ notifications: [], unreadCount: 0 });

        await useCase.execute({ userId: USER_ID, limit: 20, unreadOnly: true });

        expect(listByUser).toHaveBeenCalledWith(expect.objectContaining({ unreadOnly: true }));
    });

    it('결과 없음 — 빈 배열, nextCursor=null, unreadCount=0', async () => {
        listByUser.mockResolvedValue({ notifications: [], unreadCount: 0 });

        const result = await useCase.execute({ userId: USER_ID, limit: 20 });

        expect(result.notifications).toHaveLength(0);
        expect(result.nextCursor).toBeNull();
        expect(result.unreadCount).toBe(0);
    });

    it('deepLink 없는 알림 — deepLink 필드 미포함', async () => {
        listByUser.mockResolvedValue({
            notifications: [makeRow({ deepLink: null })],
            unreadCount: 0,
        });

        const result = await useCase.execute({ userId: USER_ID, limit: 20 });

        expect('deepLink' in result.notifications[0]!).toBe(false);
    });

    it('읽은 알림 — readAt ISO 문자열 반환', async () => {
        const readAt = new Date('2026-06-11T12:00:00.000Z');
        listByUser.mockResolvedValue({
            notifications: [makeRow({ readAt })],
            unreadCount: 0,
        });

        const result = await useCase.execute({ userId: USER_ID, limit: 20 });

        expect(result.notifications[0]!.readAt).toBe('2026-06-11T12:00:00.000Z');
    });
});
