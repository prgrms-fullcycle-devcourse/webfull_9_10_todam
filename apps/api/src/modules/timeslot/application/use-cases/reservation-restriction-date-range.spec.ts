/// <reference types="jest" />
import { CreateReservationRestrictionsUseCase } from './create-reservation-restrictions.use-case';
import { DeleteReservationRestrictionsUseCase } from './delete-reservation-restrictions.use-case';

describe('reservation restriction date range validation', () => {
    const ownership = {
        verify: jest.fn().mockResolvedValue({ reservationIntervalMinutes: 60 }),
    };
    const restrictions = {
        createManyIdempotent: jest.fn(),
        deleteByConditions: jest.fn(),
    };
    const support = {
        findOwnedProgramIds: jest.fn().mockResolvedValue(['program-1']),
        findOperatingHours: jest.fn(),
    };

    beforeEach(() => jest.clearAllMocks());

    it('rejects creating a TIME_SLOTS restriction outside the requested KST date', async () => {
        const useCase = new CreateReservationRestrictionsUseCase(
            ownership as never,
            restrictions as never,
            support as never,
        );

        await expect(
            useCase.execute('user-1', 'store-1', {
                date: '2026-06-10',
                scope: 'TIME_SLOTS',
                timeRanges: [
                    {
                        startAt: '2026-06-11T10:00:00+09:00',
                        endAt: '2026-06-11T11:00:00+09:00',
                    },
                ],
                programIds: ['program-1'],
            }),
        ).rejects.toMatchObject({ errorCode: 'INVALID_RESTRICTION_REQUEST' });
        expect(restrictions.createManyIdempotent).not.toHaveBeenCalled();
    });

    it('passes complete in-date time range pairs to conditional deletion', async () => {
        restrictions.deleteByConditions.mockResolvedValue(1);
        const useCase = new DeleteReservationRestrictionsUseCase(
            ownership as never,
            restrictions as never,
        );

        await useCase.execute('user-1', 'store-1', {
            date: '2026-06-10',
            timeRanges: [
                {
                    startAt: '2026-06-10T10:00:00+09:00',
                    endAt: '2026-06-10T12:00:00+09:00',
                },
            ],
            programIds: ['program-1'],
        });

        expect(restrictions.deleteByConditions).toHaveBeenCalledWith('store-1', {
            timeRanges: [
                {
                    startAt: new Date('2026-06-10T01:00:00.000Z'),
                    endAt: new Date('2026-06-10T03:00:00.000Z'),
                },
            ],
            programIds: ['program-1'],
        });
    });
});
