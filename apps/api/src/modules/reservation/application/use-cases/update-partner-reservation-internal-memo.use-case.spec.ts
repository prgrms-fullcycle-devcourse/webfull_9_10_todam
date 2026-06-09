/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
    PartnerReservationDetailRow,
    PartnerReservationRepository,
} from '../../domain/repositories/partner-reservation.repository';
import { UpdatePartnerReservationInternalMemoUseCase } from './update-partner-reservation-internal-memo.use-case';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function makeDetailRow(
    overrides: Partial<PartnerReservationDetailRow> = {},
): PartnerReservationDetailRow {
    return {
        id: 'res-uuid-001',
        status: ReservationStatus.CONFIRMED,
        scheduledAt: new Date('2026-06-09T01:00:00.000Z'),
        participantCount: 2,
        reserverName: '홍길동',
        reserverPhone: '01012345678',
        internalMemo: null,
        canceledAt: null,
        cancelReason: null,
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        artworkId: null,
        programTitle: '도자기 클래스',
        partnerUserId: 'partner-user-001',
        ...overrides,
    };
}

class MockRepository extends PartnerReservationRepository {
    private detailRow: PartnerReservationDetailRow | null;
    updateInternalMemoCalledWith: { reservationId: string; memo: string | null } | null = null;

    constructor(
        detailRow: PartnerReservationDetailRow | null,
        private readonly updateResult?: { id: string; internalMemo: string | null },
    ) {
        super();
        this.detailRow = detailRow;
    }

    override async findDetail(): Promise<PartnerReservationDetailRow | null> {
        return this.detailRow;
    }

    override async updateInternalMemo(
        reservationId: string,
        memo: string | null,
    ): Promise<{ id: string; internalMemo: string | null }> {
        this.updateInternalMemoCalledWith = { reservationId, memo };
        return this.updateResult ?? { id: reservationId, internalMemo: memo };
    }

    // 미사용 추상 메서드 stub
    override async findCalendarData(): Promise<never> {
        throw new Error('not impl');
    }
    override async findList(): Promise<never[]> {
        return [];
    }
    override async countPendingByKstDate(): Promise<never[]> {
        return [];
    }
    override async createManual(): Promise<null> {
        return null;
    }
    override async findForAction(): Promise<null> {
        return null;
    }
    override async confirm(): Promise<never> {
        throw new Error('not impl');
    }
    override async reject(): Promise<never> {
        throw new Error('not impl');
    }
    override async cancel(): Promise<never> {
        throw new Error('not impl');
    }
    override async complete(): Promise<never> {
        throw new Error('not impl');
    }
}

function makeUseCase(row: PartnerReservationDetailRow | null) {
    const repo = new MockRepository(row);
    return { uc: new UpdatePartnerReservationInternalMemoUseCase(repo), repo };
}

const USER_ID = 'partner-user-001';
const RESERVATION_ID = 'res-uuid-001';

// ─── 테스트 ────────────────────────────────────────────────────────────────────

describe('UpdatePartnerReservationInternalMemoUseCase', () => {
    // ── 404 ──
    describe('404 - 존재하지 않는 예약', () => {
        it('findDetail이 null이면 RESERVATION_NOT_FOUND(404)를 던진다', async () => {
            const { uc } = makeUseCase(null);
            await expect(uc.execute(USER_ID, RESERVATION_ID, '메모')).rejects.toMatchObject({
                errorCode: 'RESERVATION_NOT_FOUND',
                status: HttpStatus.NOT_FOUND,
            } as Partial<BusinessException>);
        });
    });

    // ── 403 ──
    describe('403 - 권한 없음', () => {
        it('partnerUserId가 다르면 FORBIDDEN(403)을 던진다', async () => {
            const { uc } = makeUseCase(makeDetailRow({ partnerUserId: 'other-partner' }));
            await expect(uc.execute(USER_ID, RESERVATION_ID, '메모')).rejects.toMatchObject({
                errorCode: 'FORBIDDEN',
                status: HttpStatus.FORBIDDEN,
            } as Partial<BusinessException>);
        });
    });

    // ── 200 정상 저장 ──
    describe('200 - 정상 저장', () => {
        it('200자 이내 메모를 저장하고 id와 internalMemo를 반환한다', async () => {
            const { uc } = makeUseCase(makeDetailRow());
            const result = await uc.execute(USER_ID, RESERVATION_ID, '전화 예약 / 현장 결제 예정');

            expect(result.reservation.id).toBe(RESERVATION_ID);
            expect(result.reservation.internalMemo).toBe('전화 예약 / 현장 결제 예정');
        });

        it('null을 전달하면 null이 저장된다', async () => {
            const { uc, repo } = makeUseCase(makeDetailRow());
            const result = await uc.execute(USER_ID, RESERVATION_ID, null);

            expect(result.reservation.internalMemo).toBeNull();
            expect(repo.updateInternalMemoCalledWith?.memo).toBeNull();
        });

        it('CANCELED 상태 예약에도 메모를 저장할 수 있다 (OD-2)', async () => {
            const { uc } = makeUseCase(makeDetailRow({ status: ReservationStatus.CANCELED }));
            const result = await uc.execute(USER_ID, RESERVATION_ID, '취소 후 메모');

            expect(result.reservation.id).toBe(RESERVATION_ID);
            expect(result.reservation.internalMemo).toBe('취소 후 메모');
        });

        it('모든 예약 상태에서 메모 저장이 허용된다 (OD-2)', async () => {
            const statuses = [
                ReservationStatus.PENDING,
                ReservationStatus.CONFIRMED,
                ReservationStatus.IN_PROGRESS,
                ReservationStatus.CANCELED,
            ];

            for (const status of statuses) {
                const { uc } = makeUseCase(makeDetailRow({ status }));
                await expect(uc.execute(USER_ID, RESERVATION_ID, '메모')).resolves.toBeDefined();
            }
        });
    });

    // ── OD-1: 빈 문자열 → null 정규화 ──
    describe('OD-1: 빈 문자열 정규화', () => {
        it('빈 문자열("")을 전달하면 null로 정규화되어 저장된다', async () => {
            const { uc, repo } = makeUseCase(makeDetailRow());
            const result = await uc.execute(USER_ID, RESERVATION_ID, '');

            expect(result.reservation.internalMemo).toBeNull();
            expect(repo.updateInternalMemoCalledWith?.memo).toBeNull();
        });
    });

    // ── Repository 호출 검증 ──
    describe('Repository 호출 검증', () => {
        it('updateInternalMemo에 올바른 reservationId와 memo가 전달된다', async () => {
            const { uc, repo } = makeUseCase(makeDetailRow());
            await uc.execute(USER_ID, RESERVATION_ID, '확인 메모');

            expect(repo.updateInternalMemoCalledWith).toEqual({
                reservationId: RESERVATION_ID,
                memo: '확인 메모',
            });
        });
    });
});
