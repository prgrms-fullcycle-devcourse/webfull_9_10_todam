/// <reference types="jest" />
/**
 * Phase 3c: reservation 도메인 알림 트리거 배선 검증
 *
 * - U-1: PENDING→CONFIRMED(파트너 확인) → 고객에게 TRANSACTION 알림
 * - U-2: PENDING→CANCELED(파트너 취소) → 고객에게 TRANSACTION 알림
 * - U-3: CONFIRMED→CANCELED(파트너 취소) → 고객에게 TRANSACTION 알림
 * - P-1: 신규 PENDING 예약 생성(수동확정 공방) → 파트너에게 OPERATION 알림 (create-user-reservation.use-case.spec.ts 에서 커버)
 * - P-2: 고객 취소 → 파트너에게 OPERATION 알림 (cancel-user-reservation.use-case.spec.ts 에서 커버)
 */
import { NotificationCategory, ReservationStatus } from '@prisma/client';
import { NotificationService } from '../../../notification/application/services/notification.service';
import { PartnerReservationRepository } from '../../domain/repositories/partner-reservation.repository';
import { CancelPartnerReservationUseCase } from './cancel-partner-reservation.use-case';
import { ConfirmPartnerReservationUseCase } from './confirm-partner-reservation.use-case';

// ─── 공통 상수 ────────────────────────────────────────────────────────────────

const RESERVATION_ID = 'res-001';
const PARTNER_USER_ID = 'partner-user-001';
const CUSTOMER_USER_ID = 'customer-user-001';

// ─── Mock 헬퍼 ────────────────────────────────────────────────────────────────

function makeNotificationService(): jest.Mocked<Pick<NotificationService, 'createAndDispatch'>> {
    return { createAndDispatch: jest.fn().mockResolvedValue(undefined) };
}

function makePartnerReservationRow(status: ReservationStatus) {
    return {
        id: RESERVATION_ID,
        storeId: 'store-001',
        storeTimeSlotId: 'slot-001',
        status,
        scheduledAt: new Date('2026-07-01T10:00:00.000Z'),
        participantCount: 2,
        artwork: null,
        programTitle: '도자기 체험',
        partnerUserId: PARTNER_USER_ID,
        customerUserId: CUSTOMER_USER_ID,
    };
}

// ─── ConfirmPartnerReservationUseCase (U-1) ───────────────────────────────────

describe('ConfirmPartnerReservationUseCase — U-1 알림 배선', () => {
    const confirmResult = {
        reservation: {
            id: RESERVATION_ID,
            status: ReservationStatus.CONFIRMED,
            updatedAt: new Date(),
        },
        artwork: { id: 'artwork-001', status: 'RESERVED' as const },
    };

    function makeUseCase(ns: jest.Mocked<Pick<NotificationService, 'createAndDispatch'>>) {
        const mockRepo = {
            findForAction: jest
                .fn()
                .mockResolvedValue(makePartnerReservationRow(ReservationStatus.PENDING)),
            confirm: jest.fn().mockResolvedValue(confirmResult),
            cancel: jest.fn(),
            reject: jest.fn(),
            complete: jest.fn(),
            findCalendarData: jest.fn(),
            findList: jest.fn(),
            countPendingByKstDate: jest.fn(),
            findDetail: jest.fn(),
            createManual: jest.fn(),
            updateInternalMemo: jest.fn(),
        } as unknown as PartnerReservationRepository;

        return {
            uc: new ConfirmPartnerReservationUseCase(
                mockRepo,
                ns as unknown as NotificationService,
            ),
            repo: mockRepo,
        };
    }

    it('PENDING→CONFIRMED 시 고객에게 U-1 TRANSACTION 알림이 발송된다', async () => {
        const ns = makeNotificationService();
        const { uc } = makeUseCase(ns);

        await uc.execute(PARTNER_USER_ID, RESERVATION_ID);

        expect(ns.createAndDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                recipientId: CUSTOMER_USER_ID,
                eventType: 'U-1',
                category: NotificationCategory.TRANSACTION,
                idempotencyKey: `U-1:${RESERVATION_ID}:${CUSTOMER_USER_ID}`,
            }),
        );
    });

    it('customerUserId=null이면 createAndDispatch가 호출되지 않는다 (PARTNER_MANUAL 예약)', async () => {
        const ns = makeNotificationService();
        const mockRepo = {
            findForAction: jest.fn().mockResolvedValue({
                ...makePartnerReservationRow(ReservationStatus.PENDING),
                customerUserId: null,
            }),
            confirm: jest.fn().mockResolvedValue(confirmResult),
        } as unknown as PartnerReservationRepository;

        const uc = new ConfirmPartnerReservationUseCase(
            mockRepo,
            ns as unknown as NotificationService,
        );

        await uc.execute(PARTNER_USER_ID, RESERVATION_ID);

        expect(ns.createAndDispatch).not.toHaveBeenCalled();
    });

    it('createAndDispatch 실패(삼킴)해도 confirm 결과가 정상 반환된다', async () => {
        const ns = makeNotificationService();
        ns.createAndDispatch.mockResolvedValue(undefined); // NotificationService 내부 에러는 삼킴

        const { uc } = makeUseCase(ns);

        const result = await uc.execute(PARTNER_USER_ID, RESERVATION_ID);

        expect(result.reservation.status).toBe(ReservationStatus.CONFIRMED);
    });
});

// ─── CancelPartnerReservationUseCase (U-2/U-3) ────────────────────────────────

describe('CancelPartnerReservationUseCase — U-2/U-3 알림 배선', () => {
    const cancelResult = {
        id: RESERVATION_ID,
        status: ReservationStatus.CANCELED,
        canceledBy: PARTNER_USER_ID,
        cancelReason: '공방 사정',
        canceledAt: new Date(),
    };

    function makeUseCase(
        prevStatus: ReservationStatus,
        ns: jest.Mocked<Pick<NotificationService, 'createAndDispatch'>>,
    ) {
        const mockRepo = {
            findForAction: jest.fn().mockResolvedValue(makePartnerReservationRow(prevStatus)),
            cancel: jest.fn().mockResolvedValue(cancelResult),
            confirm: jest.fn(),
            reject: jest.fn(),
            complete: jest.fn(),
            findCalendarData: jest.fn(),
            findList: jest.fn(),
            countPendingByKstDate: jest.fn(),
            findDetail: jest.fn(),
            createManual: jest.fn(),
            updateInternalMemo: jest.fn(),
        } as unknown as PartnerReservationRepository;

        return {
            uc: new CancelPartnerReservationUseCase(mockRepo, ns as unknown as NotificationService),
        };
    }

    it('PENDING→CANCELED 시 고객에게 U-2(공방 사정 취소) 알림이 발송된다', async () => {
        const ns = makeNotificationService();
        const { uc } = makeUseCase(ReservationStatus.PENDING, ns);

        await uc.execute(PARTNER_USER_ID, RESERVATION_ID, { cancelReason: '공방 사정' });

        expect(ns.createAndDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                recipientId: CUSTOMER_USER_ID,
                eventType: 'U-2',
                category: NotificationCategory.TRANSACTION,
                body: '공방 사정으로 예약이 취소됐어요.',
                idempotencyKey: `U-2:${RESERVATION_ID}:${CUSTOMER_USER_ID}`,
            }),
        );
    });

    it('CONFIRMED→CANCELED 시 고객에게 U-3(예약 취소) 알림이 발송된다', async () => {
        const ns = makeNotificationService();
        const { uc } = makeUseCase(ReservationStatus.CONFIRMED, ns);

        await uc.execute(PARTNER_USER_ID, RESERVATION_ID, { cancelReason: '취소 사유' });

        expect(ns.createAndDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                recipientId: CUSTOMER_USER_ID,
                eventType: 'U-3',
                category: NotificationCategory.TRANSACTION,
                body: '예약이 취소됐어요.',
                idempotencyKey: `U-3:${RESERVATION_ID}:${CUSTOMER_USER_ID}`,
            }),
        );
    });

    it('customerUserId=null이면 createAndDispatch가 호출되지 않는다', async () => {
        const ns = makeNotificationService();
        const mockRepo = {
            findForAction: jest.fn().mockResolvedValue({
                ...makePartnerReservationRow(ReservationStatus.PENDING),
                customerUserId: null,
            }),
            cancel: jest.fn().mockResolvedValue(cancelResult),
        } as unknown as PartnerReservationRepository;

        const uc = new CancelPartnerReservationUseCase(
            mockRepo,
            ns as unknown as NotificationService,
        );

        await uc.execute(PARTNER_USER_ID, RESERVATION_ID, { cancelReason: '사유' });

        expect(ns.createAndDispatch).not.toHaveBeenCalled();
    });
});
