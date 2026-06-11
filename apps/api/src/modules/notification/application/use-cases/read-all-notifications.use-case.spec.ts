/// <reference types="jest" />
import { ReadAllNotificationsUseCase } from './read-all-notifications.use-case';

const USER_ID = 'eb50a73f-785f-49ce-887b-5f0bba67a1e3';

describe('ReadAllNotificationsUseCase', () => {
    const listByUser = jest.fn();
    const findById = jest.fn();
    const markRead = jest.fn();
    const markAllRead = jest.fn();
    const useCase = new ReadAllNotificationsUseCase({
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

    it('미읽음 알림 전체 읽음 처리 — updatedCount 반환', async () => {
        markAllRead.mockResolvedValue(5);

        const result = await useCase.execute({ userId: USER_ID });

        expect(markAllRead).toHaveBeenCalledWith(USER_ID);
        expect(result.updatedCount).toBe(5);
    });

    it('이미 모두 읽은 경우 — updatedCount=0', async () => {
        markAllRead.mockResolvedValue(0);

        const result = await useCase.execute({ userId: USER_ID });

        expect(result.updatedCount).toBe(0);
    });
});
