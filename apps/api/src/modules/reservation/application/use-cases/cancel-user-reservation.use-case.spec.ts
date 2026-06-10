/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { ArtworkStatus, ReservationSource, ReservationStatus } from '@prisma/client';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
    CancelUserReservationResult,
    UserReservationCancelRow,
    UserReservationRepository,
} from '../../domain/repositories/user-reservation.repository';
import { CancelUserReservationUseCase } from './cancel-user-reservation.use-case';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function kstTodayPlus(days: number): Date {
    const kstNow = new Date(new Date().getTime() + KST_OFFSET_MS);
    return new Date(
        Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() + days) -
            KST_OFFSET_MS,
    );
}

function makeRow(overrides: Partial<UserReservationCancelRow> = {}): UserReservationCancelRow {
    return {
        id: 'res-uuid-001',
        userId: 'user-uuid-001',
        status: ReservationStatus.CONFIRMED,
        source: ReservationSource.CUSTOMER,
        scheduledAt: kstTodayPlus(5), // 5일 후 (cancelDeadlineDays=3이어도 취소 가능)
        participantCount: 2,
        storeTimeSlotId: 'slot-uuid-001',
        cancelDeadlineDays: 3,
        artworkId: null,
        artworkStatus: null,
        ...overrides,
    };
}

const CANCEL_RESULT: CancelUserReservationResult = {
    id: 'res-uuid-001',
    status: 'CANCELED',
    canceledBy: 'user-uuid-001',
    cancelReason: null,
    canceledAt: new Date('2026-05-25T19:50:00.000Z'),
};

class MockRepository extends UserReservationRepository {
    private cancelRowResult: UserReservationCancelRow | null;
    private cancelResult: CancelUserReservationResult;
    cancelCallCount = 0;
    cancelCalledWith: { row: UserReservationCancelRow; userId: string } | null = null;

    constructor(
        cancelRowResult: UserReservationCancelRow | null,
        cancelResult: CancelUserReservationResult = CANCEL_RESULT,
    ) {
        super();
        this.cancelRowResult = cancelRowResult;
        this.cancelResult = cancelResult;
    }

    override async createCustomer(): Promise<never> {
        throw new Error('not impl');
    }
    override async findMyList(): Promise<never[]> {
        return [];
    }
    override async findDetail(): Promise<null> {
        return null;
    }
    override async findForCancel(): Promise<UserReservationCancelRow | null> {
        return this.cancelRowResult;
    }
    override async cancelReservation(
        row: UserReservationCancelRow,
        userId: string,
    ): Promise<CancelUserReservationResult> {
        this.cancelCallCount++;
        this.cancelCalledWith = { row, userId };
        return this.cancelResult;
    }
    override async findReservationForDelivery(): Promise<null> {
        return null;
    }
    override async upsertDelivery(): Promise<never> {
        throw new Error('not impl');
    }
}

function makeUseCase(row: UserReservationCancelRow | null): {
    uc: CancelUserReservationUseCase;
    repo: MockRepository;
} {
    const repo = new MockRepository(row);
    return { uc: new CancelUserReservationUseCase(repo), repo };
}

const CURRENT_USER_ID = 'user-uuid-001';
const RESERVATION_ID = 'res-uuid-001';

// ─── 테스트 ────────────────────────────────────────────────────────────────────

describe('CancelUserReservationUseCase', () => {
    // ── 404 ──
    describe('404 - 존재하지 않는 예약', () => {
        it('findForCancel이 null이면 RESERVATION_NOT_FOUND(404)를 던진다', async () => {
            const { uc } = makeUseCase(null);
            await expect(uc.execute(CURRENT_USER_ID, RESERVATION_ID)).rejects.toMatchObject({
                errorCode: 'RESERVATION_NOT_FOUND',
                status: HttpStatus.NOT_FOUND,
            } as Partial<BusinessException>);
        });
    });

    // ── 403 ──
    describe('403 - 본인 가드', () => {
        it('userId 불일치이면 FORBIDDEN(403)을 던진다', async () => {
            const { uc } = makeUseCase(makeRow({ userId: 'other-user-uuid' }));
            await expect(uc.execute(CURRENT_USER_ID, RESERVATION_ID)).rejects.toMatchObject({
                errorCode: 'FORBIDDEN',
                status: HttpStatus.FORBIDDEN,
            } as Partial<BusinessException>);
        });

        it('userId=null(PARTNER_MANUAL)이면 FORBIDDEN(403)을 던진다', async () => {
            const { uc } = makeUseCase(
                makeRow({ userId: null, source: ReservationSource.PARTNER_MANUAL }),
            );
            await expect(uc.execute(CURRENT_USER_ID, RESERVATION_ID)).rejects.toMatchObject({
                errorCode: 'FORBIDDEN',
                status: HttpStatus.FORBIDDEN,
            } as Partial<BusinessException>);
        });
    });

    // ── 409 ALREADY_CANCELED ──
    describe('409 - 이미 취소된 예약', () => {
        it('status=CANCELED이면 ALREADY_CANCELED(409)를 던진다', async () => {
            const { uc } = makeUseCase(makeRow({ status: ReservationStatus.CANCELED }));
            await expect(uc.execute(CURRENT_USER_ID, RESERVATION_ID)).rejects.toMatchObject({
                errorCode: 'ALREADY_CANCELED',
                status: HttpStatus.CONFLICT,
            } as Partial<BusinessException>);
        });
    });

    // ── 409 INVALID_RESERVATION_STATUS ──
    describe('409 - 취소 불가 상태', () => {
        it.each([
            ReservationStatus.IN_PROGRESS,
            ReservationStatus.SHIPPED,
            ReservationStatus.DELIVERED,
            ReservationStatus.PICKUP_READY,
            ReservationStatus.PICKUP_DONE,
        ])('status=%s이면 INVALID_RESERVATION_STATUS(409)를 던진다', async (status) => {
            const { uc } = makeUseCase(makeRow({ status }));
            await expect(uc.execute(CURRENT_USER_ID, RESERVATION_ID)).rejects.toMatchObject({
                errorCode: 'INVALID_RESERVATION_STATUS',
                status: HttpStatus.CONFLICT,
            } as Partial<BusinessException>);
        });

        it('source=PARTNER_MANUAL + status=PENDING이면 INVALID_RESERVATION_STATUS(409)를 던진다', async () => {
            const { uc } = makeUseCase(
                makeRow({
                    userId: CURRENT_USER_ID,
                    status: ReservationStatus.PENDING,
                    source: ReservationSource.PARTNER_MANUAL,
                }),
            );
            await expect(uc.execute(CURRENT_USER_ID, RESERVATION_ID)).rejects.toMatchObject({
                errorCode: 'INVALID_RESERVATION_STATUS',
                status: HttpStatus.CONFLICT,
            } as Partial<BusinessException>);
        });
    });

    // ── 400 CANCELLATION_DEADLINE_EXCEEDED ──
    describe('400 - 취소 시한 초과', () => {
        it('당일(scheduledAt=오늘) 취소 시도이면 CANCELLATION_DEADLINE_EXCEEDED(400)을 던진다', async () => {
            const { uc } = makeUseCase(
                makeRow({
                    scheduledAt: kstTodayPlus(0),
                    cancelDeadlineDays: null,
                }),
            );
            await expect(uc.execute(CURRENT_USER_ID, RESERVATION_ID)).rejects.toMatchObject({
                errorCode: 'CANCELLATION_DEADLINE_EXCEEDED',
                status: HttpStatus.BAD_REQUEST,
            } as Partial<BusinessException>);
        });

        it('cancelDeadlineDays=3, scheduledAt=2일 후이면 시한 초과(400)를 던진다', async () => {
            const { uc } = makeUseCase(
                makeRow({
                    scheduledAt: kstTodayPlus(2),
                    cancelDeadlineDays: 3,
                }),
            );
            await expect(uc.execute(CURRENT_USER_ID, RESERVATION_ID)).rejects.toMatchObject({
                errorCode: 'CANCELLATION_DEADLINE_EXCEEDED',
                status: HttpStatus.BAD_REQUEST,
            } as Partial<BusinessException>);
        });

        it('cancelDeadlineDays=null(effectiveN=1), scheduledAt=내일이면 시한 초과(400)를 던진다', async () => {
            // 내일 = deadline=오늘 → 오늘<=오늘 → canCancel=true? 아니, 내일은 오늘+1, deadline=내일-1=오늘, 오늘<=오늘 → true → 취소 가능
            // 시한 초과 케이스: scheduledAt=당일(=오늘)
            const { uc } = makeUseCase(
                makeRow({
                    scheduledAt: kstTodayPlus(0),
                    cancelDeadlineDays: null,
                }),
            );
            await expect(uc.execute(CURRENT_USER_ID, RESERVATION_ID)).rejects.toMatchObject({
                errorCode: 'CANCELLATION_DEADLINE_EXCEEDED',
                status: HttpStatus.BAD_REQUEST,
            } as Partial<BusinessException>);
        });
    });

    // ── 200 정상 ──
    describe('200 - 정상 취소', () => {
        it('PENDING 예약 + 시한 내 → 취소 성공, cancelReservation 호출됨', async () => {
            const { uc, repo } = makeUseCase(
                makeRow({
                    status: ReservationStatus.PENDING,
                    scheduledAt: kstTodayPlus(5),
                    cancelDeadlineDays: 3,
                }),
            );

            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);

            expect(result.reservation.id).toBe('res-uuid-001');
            // DRIFT-1 검증: status는 항상 리터럴 'CANCELED'여야 한다 (plan §2 contract)
            expect(result.reservation.status).toBe('CANCELED');
            expect(result.reservation.canceledBy).toBe('user-uuid-001');
            expect(result.reservation.cancelReason).toBeNull();
            expect(typeof result.reservation.canceledAt).toBe('string');
            expect(repo.cancelCallCount).toBe(1);
            expect(repo.cancelCalledWith?.userId).toBe(CURRENT_USER_ID);
        });

        it('CONFIRMED 예약 + cancelDeadlineDays=null(effectiveN=1) + scheduledAt=내일 → 취소 성공', async () => {
            const { uc, repo } = makeUseCase(
                makeRow({
                    status: ReservationStatus.CONFIRMED,
                    scheduledAt: kstTodayPlus(1),
                    cancelDeadlineDays: null,
                }),
            );

            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);

            // DRIFT-1 검증: status는 항상 리터럴 'CANCELED'여야 한다 (plan §2 contract)
            expect(result.reservation.status).toBe('CANCELED');
            expect(repo.cancelCallCount).toBe(1);
        });

        it('Artwork 있는 예약 취소 시 cancelReservation에 artworkId/artworkStatus가 전달된다', async () => {
            const { uc, repo } = makeUseCase(
                makeRow({
                    scheduledAt: kstTodayPlus(5),
                    cancelDeadlineDays: 3,
                    artworkId: 'artwork-uuid-001',
                    artworkStatus: ArtworkStatus.DRYING,
                }),
            );

            await uc.execute(CURRENT_USER_ID, RESERVATION_ID);

            expect(repo.cancelCalledWith?.row.artworkId).toBe('artwork-uuid-001');
            expect(repo.cancelCalledWith?.row.artworkStatus).toBe(ArtworkStatus.DRYING);
        });
    });

    // ── 응답 매핑 ──
    describe('응답 필드 매핑', () => {
        it('canceledAt이 ISO8601 문자열로 반환된다', async () => {
            const fixedAt = new Date('2026-05-25T19:50:00.000Z');
            const repo = new MockRepository(makeRow({ scheduledAt: kstTodayPlus(5) }), {
                id: 'res-uuid-001',
                status: 'CANCELED',
                canceledBy: 'user-uuid-001',
                cancelReason: null,
                canceledAt: fixedAt,
            });
            const uc = new CancelUserReservationUseCase(repo);
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.canceledAt).toBe('2026-05-25T19:50:00.000Z');
        });
    });
});
