/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreTimeSlot } from '../../domain/entities/store-time-slot.entity';
import { ReservationRestriction } from '../../domain/entities/reservation-restriction.entity';
import { GetProgramAvailableSlotsUseCase } from './get-program-available-slots.use-case';

describe('GetProgramAvailableSlotsUseCase', () => {
    const findActiveProgramStore = jest.fn();
    const findByStore = jest.fn();
    const findByStartAts = jest.fn();

    const useCase = new GetProgramAvailableSlotsUseCase(
        { findActiveProgramStore } as never,
        { findByStore } as never,
        { findByStartAts } as never,
    );

    const PROGRAM_ID = 'prog-1';
    const STORE_ID = 'store-1';
    const query = { year: 2026, month: 6 };

    // 헬퍼: StoreTimeSlot 엔티티 생성. endAt = startAt + 2h(구분되는 종료 시각).
    const slot = (id: string, startAtIso: string, reservedCount: number, status: string) => {
        const startAt = new Date(startAtIso);
        const endAt = new Date(startAt.getTime() + 2 * 60 * 60 * 1000);
        return new StoreTimeSlot(
            id,
            STORE_ID,
            startAt,
            endAt,
            reservedCount,
            status as never,
            startAt,
            startAt,
        );
    };

    beforeEach(() => {
        findActiveProgramStore.mockReset();
        findByStore.mockReset();
        findByStartAts.mockReset();
    });

    it('프로그램이 없거나 비ACTIVE면 PROGRAM_NOT_FOUND(404)를 던진다', async () => {
        findActiveProgramStore.mockResolvedValue(null);

        try {
            await useCase.execute(PROGRAM_ID, query);
            throw new Error('Expected execute to throw');
        } catch (error) {
            expect(error).toBeInstanceOf(BusinessException);
            expect((error as BusinessException).errorCode).toBe('PROGRAM_NOT_FOUND');
            expect((error as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
        }
        expect(findByStore).not.toHaveBeenCalled();
    });

    it('슬롯이 없으면 빈 배열을 반환한다', async () => {
        findActiveProgramStore.mockResolvedValue({ storeId: STORE_ID, maxCapacityPerSlot: 4 });
        findByStore.mockResolvedValue([]);

        await expect(useCase.execute(PROGRAM_ID, query)).resolves.toEqual({ slots: [] });
        expect(findByStartAts).not.toHaveBeenCalled();
    });

    it('해당 월 KST 범위로 findByStore를 호출한다(6월 → [05-31T15:00Z, 06-30T15:00Z))', async () => {
        findActiveProgramStore.mockResolvedValue({ storeId: STORE_ID, maxCapacityPerSlot: 4 });
        findByStore.mockResolvedValue([]);

        await useCase.execute(PROGRAM_ID, query);

        expect(findByStore).toHaveBeenCalledWith(STORE_ID, {
            range: {
                start: new Date('2026-05-31T15:00:00.000Z'),
                end: new Date('2026-06-30T15:00:00.000Z'),
            },
        });
    });

    it('고객 노출은 OPEN 슬롯만: 만석·제한은 isAvailable=false 로 포함, CLOSED·CANCELED는 응답에서 제외', async () => {
        findActiveProgramStore.mockResolvedValue({ storeId: STORE_ID, maxCapacityPerSlot: 4 });
        findByStore.mockResolvedValue([
            slot('s-open', '2026-06-01T01:00:00.000Z', 2, 'OPEN'), // 잔여 2 → true
            slot('s-full', '2026-06-01T02:00:00.000Z', 4, 'OPEN'), // 잔여 0 → false(노출 O)
            slot('s-closed', '2026-06-01T03:00:00.000Z', 0, 'CLOSED'), // 제외
            slot('s-canceled', '2026-06-01T04:00:00.000Z', 0, 'CANCELED'), // 제외
            slot('s-restricted', '2026-06-01T05:00:00.000Z', 0, 'OPEN'), // 제한 → false(노출 O)
        ]);
        findByStartAts.mockResolvedValue([
            new ReservationRestriction(
                'r-1',
                STORE_ID,
                new Date('2026-06-01T05:00:00.000Z'),
                new Date('2026-06-01T05:00:00.000Z'),
                PROGRAM_ID,
                null,
                new Date('2026-06-01T05:00:00.000Z'),
            ),
        ]);

        const result = await useCase.execute(PROGRAM_ID, query);
        const byId = Object.fromEntries(result.slots.map((s) => [s.slotId, s]));

        // CLOSED·CANCELED 는 신규 예약자에게 노출되지 않으므로 응답에서 빠진다.
        expect(byId['s-closed']).toBeUndefined();
        expect(byId['s-canceled']).toBeUndefined();
        // OPEN 슬롯만 남는다(만석·제한 포함 → isAvailable=false 로 노출).
        expect(result.slots).toHaveLength(3);

        expect(byId['s-open']!.isAvailable).toBe(true);
        expect(byId['s-open']!.remainingCount).toBe(2);
        expect(byId['s-open']!.startAt).toBe('2026-06-01T01:00:00.000Z');
        expect(byId['s-open']!.endAt).toBe('2026-06-01T03:00:00.000Z');
        expect(byId['s-full']!.isAvailable).toBe(false);
        expect(byId['s-restricted']!.isAvailable).toBe(false);
    });

    it('다른 프로그램에 걸린 제한은 이 프로그램 가용성에 영향을 주지 않는다', async () => {
        findActiveProgramStore.mockResolvedValue({ storeId: STORE_ID, maxCapacityPerSlot: 4 });
        findByStore.mockResolvedValue([slot('s-open', '2026-06-01T05:00:00.000Z', 0, 'OPEN')]);
        findByStartAts.mockResolvedValue([
            new ReservationRestriction(
                'r-other',
                STORE_ID,
                new Date('2026-06-01T05:00:00.000Z'),
                new Date('2026-06-01T05:00:00.000Z'),
                'other-program', // 다른 프로그램
                null,
                new Date('2026-06-01T05:00:00.000Z'),
            ),
        ]);

        const result = await useCase.execute(PROGRAM_ID, query);
        expect(result.slots[0]!.isAvailable).toBe(true);
    });
});
