/// <reference types="jest" />
import { DEFAULT_PAGE_SIZE } from '@todam/shared';
import { ListFavoriteStoresUseCase } from './list-favorite-stores.use-case';
import type {
    FavoriteStoreListItem,
    ListFavoriteStoresResult,
} from '../../domain/repositories/store-readers';

const USER_ID = 'user-uuid-001';

function makeItem(overrides: Partial<FavoriteStoreListItem> = {}): FavoriteStoreListItem {
    return {
        favoriteId: 'fav-001',
        storeId: 'store-001',
        slug: 'test-studio',
        name: '테스트 공방',
        imageUrl: 'https://cdn.example.com/img.jpg',
        address: '서울특별시 성동구',
        createdAt: '2026-05-26T12:00:00.000Z',
        ...overrides,
    };
}

describe('ListFavoriteStoresUseCase', () => {
    const execute = jest.fn<
        Promise<ListFavoriteStoresResult>,
        [{ userId: string; cursor?: string; limit: number }]
    >();
    const useCase = new ListFavoriteStoresUseCase({ execute } as never);

    beforeEach(() => {
        execute.mockReset();
    });

    it('empty list: favoriteStores=[], nextCursor=null', async () => {
        execute.mockResolvedValue({ favoriteStores: [], nextCursor: null });

        const result = await useCase.execute(USER_ID, {});

        expect(result.favoriteStores).toHaveLength(0);
        expect(result.nextCursor).toBeNull();
    });

    it('fewer rows than limit: nextCursor=null', async () => {
        const items = [makeItem({ favoriteId: 'fav-001' }), makeItem({ favoriteId: 'fav-002' })];
        execute.mockResolvedValue({ favoriteStores: items, nextCursor: null });

        const result = await useCase.execute(USER_ID, { limit: 20 });

        expect(result.favoriteStores).toHaveLength(2);
        expect(result.nextCursor).toBeNull();
    });

    it('cursor at end (nextCursor=null): no more pages', async () => {
        const items = [makeItem({ favoriteId: 'fav-010' })];
        execute.mockResolvedValue({ favoriteStores: items, nextCursor: null });

        const result = await useCase.execute(USER_ID, { cursor: 'opaque-cursor', limit: 10 });

        expect(result.nextCursor).toBeNull();
        expect(execute).toHaveBeenCalledWith({
            userId: USER_ID,
            cursor: 'opaque-cursor',
            limit: 10,
        });
    });

    it('more rows than limit: nextCursor is non-null string', async () => {
        const nextCursor =
            'eyJjcmVhdGVkQXQiOiIyMDI2LTA1LTI1VDEyOjAwOjAwLjAwMFoiLCJpZCI6ImZhdi0wMTAifQ';
        execute.mockResolvedValue({ favoriteStores: [makeItem()], nextCursor });

        const result = await useCase.execute(USER_ID, { limit: 1 });

        expect(result.nextCursor).toBe(nextCursor);
    });

    it('PUBLISHED filter: reader is called (PUBLISHED only enforced in reader)', async () => {
        execute.mockResolvedValue({ favoriteStores: [], nextCursor: null });

        await useCase.execute(USER_ID, {});

        // reader.execute 가 호출됐다는 것 자체가 PUBLISHED 필터 위임을 의미
        expect(execute).toHaveBeenCalledTimes(1);
    });

    it('latest order: reader is called with userId (order enforced in reader)', async () => {
        execute.mockResolvedValue({ favoriteStores: [], nextCursor: null });

        await useCase.execute(USER_ID, {});

        expect(execute).toHaveBeenCalledWith(expect.objectContaining({ userId: USER_ID }));
    });

    it('uses DEFAULT_PAGE_SIZE when limit not specified', async () => {
        execute.mockResolvedValue({ favoriteStores: [], nextCursor: null });

        await useCase.execute(USER_ID, {});

        expect(execute).toHaveBeenCalledWith({
            userId: USER_ID,
            cursor: undefined,
            limit: DEFAULT_PAGE_SIZE,
        });
    });

    it('passes cursor to reader', async () => {
        execute.mockResolvedValue({ favoriteStores: [], nextCursor: null });

        await useCase.execute(USER_ID, { cursor: 'some-opaque-cursor', limit: 5 });

        expect(execute).toHaveBeenCalledWith({
            userId: USER_ID,
            cursor: 'some-opaque-cursor',
            limit: 5,
        });
    });
});
