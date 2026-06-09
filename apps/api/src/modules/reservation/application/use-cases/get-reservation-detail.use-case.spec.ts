/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import {
    ArtworkStatus,
    ReservationDeliveryMethod,
    ReservationSource,
    ReservationStatus,
} from '@prisma/client';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
    UserReservationRepository,
    UserReservationDetailRow,
    UserReservationCancelRow,
    CancelUserReservationResult,
} from '../../domain/repositories/user-reservation.repository';
import { GetReservationDetailUseCase } from './get-reservation-detail.use-case';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<UserReservationDetailRow> = {}): UserReservationDetailRow {
    return {
        id: 'res-uuid-001',
        userId: 'user-uuid-001',
        storeId: 'store-uuid-001',
        storeName: '토담 공방',
        cancelDeadlineDays: 3,
        programId: 'prog-uuid-001',
        programTitle: '물레 체험 기초반',
        programSnapshotPrice: 45000,
        scheduledAt: new Date('2099-12-31T01:00:00.000Z'), // 충분히 먼 미래 (KST=2100-01-01)
        reserverName: '김토담',
        reserverPhone: '010-1234-5678',
        participantCount: 2,
        deliveryMethod: ReservationDeliveryMethod.DELIVERY,
        shippingAddress: '서울특별시 마포구 월드컵북로 12',
        requestMemo: '왼손잡이입니다.',
        status: ReservationStatus.CONFIRMED,
        source: ReservationSource.CUSTOMER,
        artworkId: null,
        artworkStatus: null,
        createdAt: new Date('2026-05-25T19:35:00.000Z'),
        delivery: {
            recipientName: '김리듬',
            recipientPhone: '010-0000-0000',
            shippingAddress: '서울특별시 성동구 성수동 123',
            addressDetail: '101호',
            carrier: null,
            trackingNumber: null,
        },
        review: null,
        ...overrides,
    };
}

class MockRepository extends UserReservationRepository {
    constructor(private readonly row: UserReservationDetailRow | null) {
        super();
    }
    override async createCustomer(): Promise<never> {
        throw new Error('not impl');
    }
    override async findMyList(): Promise<never[]> {
        return [];
    }
    override async findDetail(): Promise<UserReservationDetailRow | null> {
        return this.row;
    }
    override async findForCancel(): Promise<UserReservationCancelRow | null> {
        return null;
    }
    override async cancelReservation(): Promise<CancelUserReservationResult> {
        throw new Error('not impl');
    }
}

function makeUseCase(row: UserReservationDetailRow | null) {
    return new GetReservationDetailUseCase(new MockRepository(row));
}

const CURRENT_USER_ID = 'user-uuid-001';
const RESERVATION_ID = 'res-uuid-001';

// ─── 테스트 ────────────────────────────────────────────────────────────────────

describe('GetReservationDetailUseCase', () => {
    // ── 404 ──
    describe('404 - 존재하지 않는 예약', () => {
        it('findDetail이 null이면 RESERVATION_NOT_FOUND(404)를 던진다', async () => {
            const uc = makeUseCase(null);
            await expect(uc.execute(CURRENT_USER_ID, RESERVATION_ID)).rejects.toMatchObject({
                errorCode: 'RESERVATION_NOT_FOUND',
                status: HttpStatus.NOT_FOUND,
            } as Partial<BusinessException>);
        });
    });

    // ── 403 ──
    describe('403 - 본인 가드', () => {
        it('userId 불일치이면 FORBIDDEN(403)을 던진다', async () => {
            const uc = makeUseCase(makeRow({ userId: 'other-user-uuid' }));
            await expect(uc.execute(CURRENT_USER_ID, RESERVATION_ID)).rejects.toMatchObject({
                errorCode: 'FORBIDDEN',
                status: HttpStatus.FORBIDDEN,
            } as Partial<BusinessException>);
        });

        it('userId=null(PARTNER_MANUAL source)도 403을 던진다', async () => {
            const uc = makeUseCase(
                makeRow({ userId: null, source: ReservationSource.PARTNER_MANUAL }),
            );
            await expect(uc.execute(CURRENT_USER_ID, RESERVATION_ID)).rejects.toMatchObject({
                errorCode: 'FORBIDDEN',
                status: HttpStatus.FORBIDDEN,
            } as Partial<BusinessException>);
        });
    });

    // ── 200 기본 ──
    describe('200 - 정상 응답', () => {
        it('기본 필드를 올바르게 매핑한다', async () => {
            const uc = makeUseCase(makeRow());
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            const r = result.reservation;

            expect(r.id).toBe('res-uuid-001');
            expect(r.storeId).toBe('store-uuid-001');
            expect(r.storeName).toBe('토담 공방');
            expect(r.programId).toBe('prog-uuid-001');
            expect(r.programTitle).toBe('물레 체험 기초반');
            expect(r.reserverName).toBe('김토담');
            expect(r.reserverPhone).toBe('010-1234-5678');
            expect(r.participantCount).toBe(2);
            expect(r.deliveryMethod).toBe(ReservationDeliveryMethod.DELIVERY);
            expect(r.requestMemo).toBe('왼손잡이입니다.');
            expect(r.status).toBe(ReservationStatus.CONFIRMED);
            expect(typeof r.scheduledAt).toBe('string'); // ISO
            expect(typeof r.createdAt).toBe('string'); // ISO
        });
    });

    // ── displayState ──
    describe('displayState', () => {
        it.each([
            [ReservationStatus.PENDING, '예약신청'],
            [ReservationStatus.CONFIRMED, '예약확정'],
            [ReservationStatus.CANCELED, '예약취소'],
            [ReservationStatus.SHIPPED, '배송 중'],
            [ReservationStatus.DELIVERED, '작품 도착'],
            [ReservationStatus.PICKUP_READY, '픽업 가능'],
            [ReservationStatus.PICKUP_DONE, '픽업 완료'],
        ])('status=%s → displayState.label=%s', async (status, expectedLabel) => {
            const uc = makeUseCase(makeRow({ status: status as ReservationStatus }));
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.displayState.label).toBe(expectedLabel);
            expect(result.reservation.displayState.subLabel).toBeNull();
        });

        it.each([
            [ArtworkStatus.DRYING, '건조', 25, 3],
            [ArtworkStatus.BISQUE_FIRING, '초벌', 50, 2],
            [ArtworkStatus.GLAZING, '유약', 75, 1],
            [ArtworkStatus.GLAZE_FIRING, '재벌', 100, 0],
        ])(
            'IN_PROGRESS + artworkStatus=%s → subLabel=%s, progress=%d, remaining=%d',
            async (artworkStatus, subLabel, progressPercent, remainingSteps) => {
                const uc = makeUseCase(
                    makeRow({
                        status: ReservationStatus.IN_PROGRESS,
                        artworkId: 'artwork-uuid-001',
                        artworkStatus: artworkStatus as ArtworkStatus,
                    }),
                );
                const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
                const r = result.reservation;
                expect(r.displayState.label).toBe('제작 중');
                expect(r.displayState.subLabel).toBe(subLabel);
                expect(r.artwork).not.toBeNull();
                expect(r.artwork!.progressPercent).toBe(progressPercent);
                expect(r.artwork!.remainingSteps).toBe(remainingSteps);
            },
        );
    });

    // ── totalPrice ──
    describe('totalPrice', () => {
        it('programSnapshotPrice × participantCount 를 올바르게 계산한다', async () => {
            const uc = makeUseCase(makeRow({ programSnapshotPrice: 45000, participantCount: 2 }));
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.totalPrice).toBe(90000);
        });
    });

    // ── canCancel ──
    describe('canCancel', () => {
        it('status=CANCELED이면 canCancel=false', async () => {
            const uc = makeUseCase(makeRow({ status: ReservationStatus.CANCELED }));
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.canCancel).toBe(false);
        });

        it('source=PARTNER_MANUAL + status=PENDING이면 canCancel=false', async () => {
            const uc = makeUseCase(
                makeRow({
                    userId: CURRENT_USER_ID, // userId 일치시켜 403 우회
                    status: ReservationStatus.PENDING,
                    source: ReservationSource.PARTNER_MANUAL,
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.canCancel).toBe(false);
        });

        it('오늘이 scheduledAt과 같은 날이면 canCancel=false (당일 불가 baseline)', async () => {
            // 오늘 KST 날짜를 scheduledAt으로 설정
            const todayKST = new Date();
            const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
            const kstNow = new Date(todayKST.getTime() + KST_OFFSET_MS);
            // KST 자정으로 설정
            const scheduledAt = new Date(
                Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) -
                    KST_OFFSET_MS,
            );

            const uc = makeUseCase(
                makeRow({
                    status: ReservationStatus.CONFIRMED,
                    source: ReservationSource.CUSTOMER,
                    scheduledAt,
                    cancelDeadlineDays: null,
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.canCancel).toBe(false);
        });

        it('cancelDeadlineDays=null이면 effectiveN=1 적용 — scheduledAt 2일 후면 true', async () => {
            const twoLaterKST = new Date();
            const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
            const kstNow = new Date(twoLaterKST.getTime() + KST_OFFSET_MS);
            // KST 기준 2일 후 자정(UTC)
            const scheduledAt = new Date(
                Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() + 2) -
                    KST_OFFSET_MS,
            );

            const uc = makeUseCase(
                makeRow({
                    status: ReservationStatus.CONFIRMED,
                    source: ReservationSource.CUSTOMER,
                    scheduledAt,
                    cancelDeadlineDays: null, // effectiveN=1, deadline=scheduledAt-1=내일 → 오늘<=내일 → true
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.canCancel).toBe(true);
            expect(result.reservation.cancelDeadlineDays).toBeNull();
        });

        it('cancelDeadlineDays=3, scheduledAt=2일 후 → canCancel=false (마감 지남)', async () => {
            const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
            const kstNow = new Date(new Date().getTime() + KST_OFFSET_MS);
            const scheduledAt = new Date(
                Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() + 2) -
                    KST_OFFSET_MS,
            );

            const uc = makeUseCase(
                makeRow({
                    status: ReservationStatus.CONFIRMED,
                    source: ReservationSource.CUSTOMER,
                    scheduledAt,
                    cancelDeadlineDays: 3, // deadline = scheduledAt-3 = 1일 전 → 오늘 > 1일 전 → false
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.canCancel).toBe(false);
            expect(result.reservation.cancelDeadlineDays).toBe(3);
        });
    });

    // ── artwork (IN_PROGRESS 밖은 null) ──
    describe('artwork null 조건', () => {
        it('status != IN_PROGRESS이면 artwork=null', async () => {
            const uc = makeUseCase(
                makeRow({
                    status: ReservationStatus.CONFIRMED,
                    artworkId: 'artwork-uuid-001',
                    artworkStatus: ArtworkStatus.DRYING,
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.artwork).toBeNull();
        });

        it('IN_PROGRESS이지만 artworkStatus=RESERVED이면 artwork=null', async () => {
            const uc = makeUseCase(
                makeRow({
                    status: ReservationStatus.IN_PROGRESS,
                    artworkId: 'artwork-uuid-001',
                    artworkStatus: ArtworkStatus.RESERVED,
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.artwork).toBeNull();
        });

        it('IN_PROGRESS이지만 artwork=null이면 artwork=null', async () => {
            const uc = makeUseCase(
                makeRow({
                    status: ReservationStatus.IN_PROGRESS,
                    artworkId: null,
                    artworkStatus: null,
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.artwork).toBeNull();
        });
    });

    // ── delivery ──
    describe('delivery', () => {
        it('deliveryMethod=DELIVERY + Delivery 레코드 있으면 delivery 객체 반환', async () => {
            const uc = makeUseCase(
                makeRow({
                    deliveryMethod: ReservationDeliveryMethod.DELIVERY,
                    delivery: {
                        recipientName: '김리듬',
                        recipientPhone: '010-0000-0000',
                        shippingAddress: '서울특별시 성동구 성수동 123',
                        addressDetail: '101호',
                        carrier: '우체국 택배',
                        trackingNumber: '1111222233334',
                    },
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            const d = result.reservation.delivery;
            expect(d).not.toBeNull();
            expect(d!.recipientName).toBe('김리듬');
            expect(d!.address).toBe('서울특별시 성동구 성수동 123 101호');
            expect(d!.carrier).toBe('우체국 택배');
            expect(d!.trackingNumber).toBe('1111222233334');
        });

        it('deliveryMethod=PICKUP이면 delivery=null', async () => {
            const uc = makeUseCase(
                makeRow({
                    deliveryMethod: ReservationDeliveryMethod.PICKUP,
                    delivery: null,
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.delivery).toBeNull();
        });

        it('deliveryMethod=DELIVERY이지만 Delivery 레코드 없으면 delivery=null', async () => {
            const uc = makeUseCase(
                makeRow({
                    deliveryMethod: ReservationDeliveryMethod.DELIVERY,
                    delivery: null,
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.delivery).toBeNull();
        });
    });

    // ── shippingAddress (legacy 호환) ──
    // plan: shippingAddress = Delivery.shippingAddress 직매핑. deliveryMethod=PICKUP이면 null.
    describe('shippingAddress (legacy)', () => {
        it('deliveryMethod=DELIVERY + delivery.shippingAddress 있으면 Delivery.shippingAddress 직매핑', async () => {
            const uc = makeUseCase(
                makeRow({
                    deliveryMethod: ReservationDeliveryMethod.DELIVERY,
                    delivery: {
                        recipientName: '김리듬',
                        recipientPhone: '010-0000-0000',
                        shippingAddress: '서울특별시 마포구 월드컵북로 12',
                        addressDetail: '101호',
                        carrier: null,
                        trackingNumber: null,
                    },
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            // shippingAddress = Delivery.shippingAddress (not delivery.address combination)
            expect(result.reservation.shippingAddress).toBe('서울특별시 마포구 월드컵북로 12');
        });

        it('deliveryMethod=PICKUP이면 shippingAddress=null', async () => {
            const uc = makeUseCase(
                makeRow({
                    deliveryMethod: ReservationDeliveryMethod.PICKUP,
                    delivery: null,
                    shippingAddress: null,
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.shippingAddress).toBeNull();
        });
    });

    // ── hasReview / reviewId ──
    describe('hasReview / reviewId', () => {
        it('review 없으면 hasReview=false, reviewId=null', async () => {
            const uc = makeUseCase(makeRow({ review: null }));
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.hasReview).toBe(false);
            expect(result.reservation.reviewId).toBeNull();
        });

        it('review 있으면 hasReview=true, reviewId=review.id', async () => {
            const uc = makeUseCase(makeRow({ review: { id: 'review-uuid-001' } }));
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID);
            expect(result.reservation.hasReview).toBe(true);
            expect(result.reservation.reviewId).toBe('review-uuid-001');
        });
    });
});
