/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { ReservationDeliveryMethod, ReservationStatus } from '@prisma/client';
import type { DeliveryEditRequest } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
    UpsertDeliveryInput,
    UpsertDeliveryResult,
    UserReservationDeliveryGuardRow,
    UserReservationRepository,
} from '../../domain/repositories/user-reservation.repository';
import { UpdateDeliveryUseCase } from './update-delivery.use-case';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

const VALID_INPUT: DeliveryEditRequest = {
    recipientName: '김리듬',
    recipientPhone: '010-9876-5432',
    postalCode: '04001',
    address: '서울특별시 마포구 월드컵북로 12',
    addressDetail: '101호',
};

const VALID_INPUT_NO_DETAIL: DeliveryEditRequest = {
    recipientName: '김리듬',
    recipientPhone: '010-9876-5432',
    postalCode: '04001',
    address: '서울특별시 마포구 월드컵북로 12',
};

function makeGuardRow(
    overrides: Partial<UserReservationDeliveryGuardRow> = {},
): UserReservationDeliveryGuardRow {
    return {
        userId: 'user-uuid-001',
        deliveryMethod: ReservationDeliveryMethod.DELIVERY,
        status: ReservationStatus.CONFIRMED,
        ...overrides,
    };
}

const UPSERT_RESULT: UpsertDeliveryResult = {
    recipientName: '김리듬',
    recipientPhone: '010-9876-5432',
    postalCode: '04001',
    address: '서울특별시 마포구 월드컵북로 12',
    addressDetail: '101호',
};

class MockRepository extends UserReservationRepository {
    private guardRow: UserReservationDeliveryGuardRow | null;
    upsertCallCount = 0;
    upsertCalledWith: { reservationId: string; input: UpsertDeliveryInput } | null = null;
    private upsertResult: UpsertDeliveryResult;

    constructor(
        guardRow: UserReservationDeliveryGuardRow | null,
        upsertResult: UpsertDeliveryResult = UPSERT_RESULT,
    ) {
        super();
        this.guardRow = guardRow;
        this.upsertResult = upsertResult;
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
    override async findForCancel(): Promise<null> {
        return null;
    }
    override async cancelReservation(): Promise<never> {
        throw new Error('not impl');
    }
    override async findReservationForDelivery(): Promise<UserReservationDeliveryGuardRow | null> {
        return this.guardRow;
    }
    override async upsertDelivery(
        reservationId: string,
        input: UpsertDeliveryInput,
    ): Promise<UpsertDeliveryResult> {
        this.upsertCallCount++;
        this.upsertCalledWith = { reservationId, input };
        return this.upsertResult;
    }
}

function makeUseCase(
    row: UserReservationDeliveryGuardRow | null,
    upsertResult?: UpsertDeliveryResult,
) {
    const repo = new MockRepository(row, upsertResult);
    return { uc: new UpdateDeliveryUseCase(repo), repo };
}

const CURRENT_USER_ID = 'user-uuid-001';
const RESERVATION_ID = 'res-uuid-001';

// ─── 테스트 ────────────────────────────────────────────────────────────────────

describe('UpdateDeliveryUseCase', () => {
    // ── 404 ──
    describe('404 - 존재하지 않는 예약', () => {
        it('findReservationForDelivery가 null이면 RESERVATION_NOT_FOUND(404)를 던진다', async () => {
            const { uc } = makeUseCase(null);
            await expect(
                uc.execute(CURRENT_USER_ID, RESERVATION_ID, VALID_INPUT),
            ).rejects.toMatchObject({
                errorCode: 'RESERVATION_NOT_FOUND',
                status: HttpStatus.NOT_FOUND,
            } as Partial<BusinessException>);
        });
    });

    // ── 403 ──
    describe('403 - 본인 가드', () => {
        it('userId 불일치이면 FORBIDDEN(403)을 던진다', async () => {
            const { uc } = makeUseCase(makeGuardRow({ userId: 'other-user-uuid' }));
            await expect(
                uc.execute(CURRENT_USER_ID, RESERVATION_ID, VALID_INPUT),
            ).rejects.toMatchObject({
                errorCode: 'FORBIDDEN',
                status: HttpStatus.FORBIDDEN,
            } as Partial<BusinessException>);
        });

        it('userId=null(PARTNER_MANUAL)이면 FORBIDDEN(403)을 던진다', async () => {
            const { uc } = makeUseCase(makeGuardRow({ userId: null }));
            await expect(
                uc.execute(CURRENT_USER_ID, RESERVATION_ID, VALID_INPUT),
            ).rejects.toMatchObject({
                errorCode: 'FORBIDDEN',
                status: HttpStatus.FORBIDDEN,
            } as Partial<BusinessException>);
        });
    });

    // ── 409 PICKUP_NOT_ALLOWED ──
    describe('409 - 픽업 예약', () => {
        it('deliveryMethod=PICKUP이면 PICKUP_NOT_ALLOWED(409)를 던진다', async () => {
            const { uc } = makeUseCase(
                makeGuardRow({ deliveryMethod: ReservationDeliveryMethod.PICKUP }),
            );
            await expect(
                uc.execute(CURRENT_USER_ID, RESERVATION_ID, VALID_INPUT),
            ).rejects.toMatchObject({
                errorCode: 'PICKUP_NOT_ALLOWED',
                status: HttpStatus.CONFLICT,
            } as Partial<BusinessException>);
        });
    });

    // ── 409 DELIVERY_NOT_EDITABLE ──
    describe('409 - 수정 잠금', () => {
        it.each([ReservationStatus.SHIPPED, ReservationStatus.DELIVERED])(
            'status=%s이면 DELIVERY_NOT_EDITABLE(409)를 던진다',
            async (status) => {
                const { uc } = makeUseCase(makeGuardRow({ status }));
                await expect(
                    uc.execute(CURRENT_USER_ID, RESERVATION_ID, VALID_INPUT),
                ).rejects.toMatchObject({
                    errorCode: 'DELIVERY_NOT_EDITABLE',
                    status: HttpStatus.CONFLICT,
                } as Partial<BusinessException>);
            },
        );
    });

    // ── 200 정상 create ──
    describe('200 - 정상 저장 (create)', () => {
        it('Delivery row 없는 첫 저장 시 upsertDelivery가 호출되고 결과를 반환한다', async () => {
            const { uc, repo } = makeUseCase(makeGuardRow());
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID, VALID_INPUT);

            expect(repo.upsertCallCount).toBe(1);
            expect(repo.upsertCalledWith?.reservationId).toBe(RESERVATION_ID);
            expect(result.delivery.recipientName).toBe('김리듬');
            expect(result.delivery.recipientPhone).toBe('010-9876-5432');
            expect(result.delivery.postalCode).toBe('04001');
            expect(result.delivery.address).toBe('서울특별시 마포구 월드컵북로 12');
            expect(result.delivery.addressDetail).toBe('101호');
        });
    });

    // ── 200 정상 update ──
    describe('200 - 정상 저장 (update)', () => {
        it('두 번째 저장 시에도 upsertDelivery가 호출되고 갱신된 결과를 반환한다', async () => {
            const updatedResult: UpsertDeliveryResult = {
                recipientName: '박서울',
                recipientPhone: '010-1111-2222',
                postalCode: '06336',
                address: '서울특별시 강남구 테헤란로 152',
                addressDetail: '22층',
            };
            const { uc, repo } = makeUseCase(makeGuardRow(), updatedResult);
            const updateInput: DeliveryEditRequest = {
                recipientName: '박서울',
                recipientPhone: '010-1111-2222',
                postalCode: '06336',
                address: '서울특별시 강남구 테헤란로 152',
                addressDetail: '22층',
            };
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID, updateInput);

            expect(repo.upsertCallCount).toBe(1);
            expect(result.delivery.recipientName).toBe('박서울');
            expect(result.delivery.address).toBe('서울특별시 강남구 테헤란로 152');
        });
    });

    // ── address ↔ shippingAddress 매핑 ──
    describe('address ↔ shippingAddress 매핑', () => {
        it('input.address가 upsertDelivery에 그대로 전달된다 (repo 내부에서 shippingAddress로 저장)', async () => {
            const { uc, repo } = makeUseCase(makeGuardRow());
            await uc.execute(CURRENT_USER_ID, RESERVATION_ID, VALID_INPUT);

            expect(repo.upsertCalledWith?.input.address).toBe(VALID_INPUT.address);
        });

        it('repo 반환의 address 필드가 응답 delivery.address로 노출된다', async () => {
            const { uc } = makeUseCase(makeGuardRow());
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID, VALID_INPUT);

            expect(result.delivery.address).toBe(UPSERT_RESULT.address);
        });
    });

    // ── addressDetail optional ──
    describe('addressDetail optional', () => {
        it('addressDetail 미포함 input 전달 시 upsertDelivery에 addressDetail이 없다', async () => {
            const resultWithoutDetail: UpsertDeliveryResult = {
                recipientName: '김리듬',
                recipientPhone: '010-9876-5432',
                postalCode: '04001',
                address: '서울특별시 마포구 월드컵북로 12',
            };
            const { uc, repo } = makeUseCase(makeGuardRow(), resultWithoutDetail);
            const result = await uc.execute(CURRENT_USER_ID, RESERVATION_ID, VALID_INPUT_NO_DETAIL);

            expect(repo.upsertCalledWith?.input.addressDetail).toBeUndefined();
            expect(result.delivery.addressDetail).toBeUndefined();
        });
    });

    // ── 모든 ReservationStatus 중 PENDING·CONFIRMED·IN_PROGRESS·PICKUP_READY·PICKUP_DONE 은 허용 ──
    describe('수정 가능 상태 (잠금 미적용)', () => {
        it.each([
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.IN_PROGRESS,
        ])('status=%s이면 upsert가 성공한다', async (status) => {
            const { uc, repo } = makeUseCase(makeGuardRow({ status }));
            await uc.execute(CURRENT_USER_ID, RESERVATION_ID, VALID_INPUT);
            expect(repo.upsertCallCount).toBe(1);
        });
    });
});
