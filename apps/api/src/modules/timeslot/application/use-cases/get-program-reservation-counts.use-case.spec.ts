/// <reference types="jest" />
import { GetProgramReservationCountsUseCase } from './get-program-reservation-counts.use-case';
import {
    createPartnerReservationRequestSchema,
    createUserReservationRequestSchema,
    programReservationCountsQuerySchema,
    slotKeySchema,
} from '@todam/shared';

describe('GetProgramReservationCountsUseCase', () => {
    const ownership = { verify: jest.fn() };
    const support = {
        groupConfirmedByWindows: jest.fn(),
        findProgramNames: jest.fn(),
    };
    const useCase = new GetProgramReservationCountsUseCase(ownership as never, support as never);

    beforeEach(() => {
        jest.clearAllMocks();
        ownership.verify.mockResolvedValue({});
        support.groupConfirmedByWindows.mockResolvedValue([{ programId: 'program-1', count: 2 }]);
        support.findProgramNames.mockResolvedValue(new Map([['program-1', '도자기']]));
    });

    it('aggregates by virtual slotKey windows without requiring physical slots', async () => {
        const result = await useCase.execute('user-1', 'store-1', {
            date: '2026-06-10',
            slotKeys: '2026-06-10T01:00:00.000Z|2026-06-10T03:00:00.000Z',
        });

        expect(support.groupConfirmedByWindows).toHaveBeenCalledWith('store-1', [
            {
                startAt: new Date('2026-06-10T01:00:00.000Z'),
                endAt: new Date('2026-06-10T03:00:00.000Z'),
            },
        ]);
        expect(result.programs).toEqual([
            { programId: 'program-1', programName: '도자기', confirmedReservationCount: 2 },
        ]);
    });

    it('rejects malformed slotKeys at the shared contract boundary', () => {
        for (const slotKeys of [
            'not-a-slot-key',
            ',,,',
            '2026-06-10T01:00:00.000Z|2026-06-10T03:00:00.000Z,',
        ]) {
            expect(
                programReservationCountsQuerySchema.safeParse({
                    date: '2026-06-10',
                    slotKeys,
                }).success,
            ).toBe(false);
        }
    });

    it('requires ISO datetimes for shared and manual-reservation slotKeys', () => {
        expect(slotKeySchema.safeParse('June 10 2026|June 11 2026').success).toBe(false);
        expect(
            createPartnerReservationRequestSchema.safeParse({
                programId: 'program-1',
                slotKey: 'June 10 2026|June 11 2026',
                reserverName: 'Customer',
                reserverPhone: '010-0000-0000',
                participantCount: 1,
                initialStatus: 'CONFIRMED',
            }).success,
        ).toBe(false);
    });

    it('accepts offset datetimes for customer and partner reservation startAt', () => {
        expect(
            createUserReservationRequestSchema.safeParse({
                programId: '11111111-1111-4111-8111-111111111111',
                startAt: '2026-06-10T10:00:00+09:00',
                reserverName: 'Customer',
                reserverPhone: '010-0000-0000',
                participantCount: 1,
            }).success,
        ).toBe(true);
        expect(
            createPartnerReservationRequestSchema.safeParse({
                programId: 'program-1',
                startAt: '2026-06-10T10:00:00+09:00',
                reserverName: 'Customer',
                reserverPhone: '010-0000-0000',
                participantCount: 1,
                initialStatus: 'CONFIRMED',
            }).success,
        ).toBe(true);
    });
});
