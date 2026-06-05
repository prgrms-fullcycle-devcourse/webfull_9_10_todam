/// <reference types="jest" />
import { ArtworkStatus, ReservationStatus } from '@prisma/client';
import { ListUserReservationsUseCase } from './list-user-reservations.use-case';
import { calcDisplayState } from '../../domain/display-state.util';
import type { UserReservationListRow } from '../../domain/repositories/user-reservation.repository';

const USER_ID = 'user-001';

function makeRow(overrides: Partial<UserReservationListRow> = {}): UserReservationListRow {
    return {
        id: 'res-001',
        storeName: 'test-store',
        programTitle: 'test-program',
        scheduledAt: new Date('2026-06-01T10:00:00.000Z'),
        participantCount: 2,
        status: ReservationStatus.PENDING,
        artworkStatus: null,
        createdAt: new Date('2026-05-25T19:35:00.000Z'),
        ...overrides,
    };
}

describe('ListUserReservationsUseCase', () => {
    const findMyList = jest.fn();
    const useCase = new ListUserReservationsUseCase({ findMyList } as never);

    beforeEach(() => {
        findMyList.mockReset();
    });

    it('empty list returns reservations=[], hasMore=false, nextCursor=null', async () => {
        findMyList.mockResolvedValue([]);

        const result = await useCase.execute(USER_ID, { limit: 20 });

        expect(result.reservations).toHaveLength(0);
        expect(result.hasMore).toBe(false);
        expect(result.nextCursor).toBeNull();
    });

    it('fewer rows than limit: hasMore=false, nextCursor=null', async () => {
        const rows = [makeRow({ id: 'res-001' }), makeRow({ id: 'res-002' })];
        findMyList.mockResolvedValue(rows);

        const result = await useCase.execute(USER_ID, { limit: 20 });

        expect(result.reservations).toHaveLength(2);
        expect(result.hasMore).toBe(false);
        expect(result.nextCursor).toBeNull();
    });

    it('limit+1 rows returned: hasMore=true, nextCursor=last-page-item-id', async () => {
        const rows = [
            makeRow({ id: 'res-001', createdAt: new Date('2026-05-25T19:35:00.000Z') }),
            makeRow({ id: 'res-002', createdAt: new Date('2026-05-24T10:00:00.000Z') }),
            makeRow({ id: 'res-003', createdAt: new Date('2026-05-23T10:00:00.000Z') }),
        ];
        findMyList.mockResolvedValue(rows);

        const result = await useCase.execute(USER_ID, { limit: 2 });

        expect(result.reservations).toHaveLength(2);
        expect(result.hasMore).toBe(true);
        expect(result.nextCursor).toBe('res-002');
    });

    it('passes status filter to repository', async () => {
        findMyList.mockResolvedValue([]);

        await useCase.execute(USER_ID, { status: ReservationStatus.IN_PROGRESS, limit: 20 });

        expect(findMyList).toHaveBeenCalledWith(USER_ID, {
            status: ReservationStatus.IN_PROGRESS,
            cursor: undefined,
            limit: 20,
        });
    });

    it('passes cursor to repository', async () => {
        findMyList.mockResolvedValue([]);

        await useCase.execute(USER_ID, { cursor: 'res-010', limit: 10 });

        expect(findMyList).toHaveBeenCalledWith(USER_ID, {
            status: undefined,
            cursor: 'res-010',
            limit: 10,
        });
    });

    it('uses default limit 20 when not specified', async () => {
        findMyList.mockResolvedValue([]);

        await useCase.execute(USER_ID, {});

        expect(findMyList).toHaveBeenCalledWith(USER_ID, {
            status: undefined,
            cursor: undefined,
            limit: 20,
        });
    });

    it('converts dates to ISO strings', async () => {
        findMyList.mockResolvedValue([makeRow()]);

        const result = await useCase.execute(USER_ID, {});
        const item = result.reservations[0]!;

        expect(item.scheduledAt).toBe('2026-06-01T10:00:00.000Z');
        expect(item.createdAt).toBe('2026-05-25T19:35:00.000Z');
    });

    // displayState mapping — compare against calcDisplayState directly to avoid
    // encoding issues with Korean literals in test assertions.

    it.each([
        ReservationStatus.PENDING,
        ReservationStatus.CONFIRMED,
        ReservationStatus.CANCELED,
        ReservationStatus.SHIPPED,
        ReservationStatus.DELIVERED,
        ReservationStatus.PICKUP_READY,
        ReservationStatus.PICKUP_DONE,
    ])(
        'non-IN_PROGRESS status %s: displayState matches calcDisplayState, subLabel null',
        async (status) => {
            findMyList.mockResolvedValue([makeRow({ status })]);

            const result = await useCase.execute(USER_ID, {});
            const item = result.reservations[0]!;

            expect(item.displayState).toEqual(calcDisplayState(status, null));
            expect(item.displayState.subLabel).toBeNull();
        },
    );

    it('DELIVERED: description is empty string (UI hidden)', async () => {
        findMyList.mockResolvedValue([makeRow({ status: ReservationStatus.DELIVERED })]);

        const result = await useCase.execute(USER_ID, {});

        expect(result.reservations[0]!.displayState.description).toBe('');
        expect(result.reservations[0]!.displayState.label).toBe('작품 도착');
    });

    it('PICKUP_DONE: description is empty string (UI hidden)', async () => {
        findMyList.mockResolvedValue([makeRow({ status: ReservationStatus.PICKUP_DONE })]);

        const result = await useCase.execute(USER_ID, {});

        expect(result.reservations[0]!.displayState.description).toBe('');
        expect(result.reservations[0]!.displayState.label).toBe('픽업 완료');
    });

    // IN_PROGRESS + Artwork.status 4 substates

    it.each([
        [ArtworkStatus.DRYING, '건조'],
        [ArtworkStatus.BISQUE_FIRING, '초벌'],
        [ArtworkStatus.GLAZING, '유약'],
        [ArtworkStatus.GLAZE_FIRING, '재벌'],
    ] as const)('IN_PROGRESS + %s: subLabel=%s', async (artworkStatus, expectedSubLabel) => {
        findMyList.mockResolvedValue([
            makeRow({ status: ReservationStatus.IN_PROGRESS, artworkStatus }),
        ]);

        const result = await useCase.execute(USER_ID, {});
        const item = result.reservations[0]!;

        expect(item.displayState.label).toBe('제작 중');
        expect(item.displayState.subLabel).toBe(expectedSubLabel);
        expect(item.displayState.description).not.toBe('');
    });

    it('IN_PROGRESS + artworkStatus=null: label set, subLabel null (default)', async () => {
        findMyList.mockResolvedValue([
            makeRow({ status: ReservationStatus.IN_PROGRESS, artworkStatus: null }),
        ]);

        const result = await useCase.execute(USER_ID, {});
        const item = result.reservations[0]!;

        expect(item.displayState.label).toBe('제작 중');
        expect(item.displayState.subLabel).toBeNull();
    });

    it('IN_PROGRESS + RESERVED (pre-entry): label set, subLabel null (default)', async () => {
        findMyList.mockResolvedValue([
            makeRow({
                status: ReservationStatus.IN_PROGRESS,
                artworkStatus: ArtworkStatus.RESERVED,
            }),
        ]);

        const result = await useCase.execute(USER_ID, {});
        const item = result.reservations[0]!;

        expect(item.displayState.label).toBe('제작 중');
        expect(item.displayState.subLabel).toBeNull();
    });
});
