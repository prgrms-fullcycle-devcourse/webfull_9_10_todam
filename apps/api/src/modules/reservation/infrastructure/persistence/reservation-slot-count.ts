import { HttpStatus } from '@nestjs/common';
import { Prisma, ReservationStatus, StoreTimeSlotStatus } from '@prisma/client';
import { BusinessException } from '../../../../common/exceptions/business.exception';

/**
 * 예약 동시성 처리 공통 모듈.
 *
 * 슬롯 정원(reservedCount) 증감과 예약 상태 전이를 DB 단일 문장으로 원자 처리한다.
 * "조회 후 계산하여 저장"(read-modify-write)이나 "검증 후 id만으로 업데이트"는
 * 동시 요청 시 증감 유실·상태 덮어쓰기에 취약하므로 사용하지 않는다.
 * partner/user 예약 repository가 함께 사용한다.
 */

/**
 * 정원이 남아 있을 때만 reservedCount를 조건부로 증가시킨다.
 *
 * `status = OPEN AND reservedCount <= max - amount` 인 행에만 적용되므로,
 * 동시 예약이 들어와도 정원 초과 증가가 발생하지 않는다.
 *
 * @returns 증가에 성공하면 true, 슬롯이 닫혔거나 잔여 정원이 부족하면 false.
 */
export async function tryIncrementReservedCount(
    tx: Prisma.TransactionClient,
    storeTimeSlotId: string,
    amount: number,
    maxCapacity: number,
): Promise<boolean> {
    const result = await tx.storeTimeSlot.updateMany({
        where: {
            id: storeTimeSlotId,
            status: StoreTimeSlotStatus.OPEN,
            reservedCount: { lte: maxCapacity - amount },
        },
        data: { reservedCount: { increment: amount } },
    });
    return result.count > 0;
}

/**
 * reservedCount를 원자적으로 차감한다. 0 미만으로는 내려가지 않는다(GREATEST(0, ...)).
 *
 * 조회 없이 단일 UPDATE로 처리하므로 동시 취소 시에도 차감이 유실되지 않는다.
 * raw SQL은 Prisma의 @updatedAt 적용을 우회하므로, 증가 경로(updateMany)와 동일하게
 * updated_at을 직접 갱신한다.
 */
export async function decrementReservedCount(
    tx: Prisma.TransactionClient,
    storeTimeSlotId: string,
    amount: number,
): Promise<void> {
    await tx.$executeRaw`
        UPDATE "store_time_slots"
        SET "reserved_count" = GREATEST(0, "reserved_count" - ${amount}),
            "updated_at" = NOW()
        WHERE "id" = ${storeTimeSlotId}::uuid
    `;
}

/**
 * 기대 상태(expectedStatus)일 때만 예약 상태를 전이시킨다(낙관적 동시성 가드).
 *
 * `where: { id, status: expectedStatus }` 로 갱신하므로, 검증 시점과 갱신 시점 사이에
 * 다른 요청이 상태를 바꿨다면 0건이 갱신되어 CONFLICT 예외를 던진다.
 * 동시 승인·취소 요청 중 정확히 하나만 성공한다.
 *
 * @throws BusinessException INVALID_RESERVATION_STATUS(409) 갱신 대상이 0건일 때.
 */
export async function assertReservationStatusTransition(
    tx: Prisma.TransactionClient,
    reservationId: string,
    expectedStatus: ReservationStatus,
    data: Prisma.ReservationUncheckedUpdateManyInput,
): Promise<void> {
    const result = await tx.reservation.updateMany({
        where: { id: reservationId, status: expectedStatus },
        data,
    });

    if (result.count === 0) {
        throw new BusinessException(
            'INVALID_RESERVATION_STATUS',
            '예약 상태가 이미 변경되어 처리할 수 없습니다.',
            HttpStatus.CONFLICT,
        );
    }
}
