import { ReservationSource, ReservationStatus } from '@prisma/client';
import { subDaysNum, toKSTDateNum } from './date.util';

/**
 * 유저 예약 취소 가능 여부 판정 (SSOT: 예약 상세조회 plan § canCancel 계산 규칙).
 *
 * 상세 조회(canCancel 플래그)와 취소 use-case(게이트)가 동일 함수를 공유하여
 * 규칙 drift를 방지한다.
 *
 * 반환: true → 취소 가능, false → 불가.
 *
 * 주의: 취소 use-case에서는 "왜 불가인지"(이미취소/상태불가/시한초과)를
 * 개별로 분기해야 하므로, 이 함수는 boolean 플래그 전용이다.
 * 시한 계산 공용 헬퍼(toKSTDateNum, subDaysNum)는 date.util.ts 참조.
 */
export function canCancelReservation(
    status: ReservationStatus,
    source: ReservationSource,
    scheduledAt: Date,
    cancelDeadlineDays: number | null,
    now: Date = new Date(),
): boolean {
    // 전제: status ∈ {PENDING, CONFIRMED}
    if (status !== ReservationStatus.PENDING && status !== ReservationStatus.CONFIRMED) {
        return false;
    }
    // 전제: source === CUSTOMER
    if (source !== ReservationSource.CUSTOMER) {
        return false;
    }

    const todayNum = toKSTDateNum(now);
    const scheduledNum = toKSTDateNum(scheduledAt);

    // 당일 취소 불가 baseline
    if (todayNum >= scheduledNum) {
        return false;
    }

    const effectiveN = Math.max(cancelDeadlineDays ?? 1, 1);
    const deadlineNum = subDaysNum(scheduledNum, effectiveN);

    return todayNum <= deadlineNum;
}

/**
 * 취소 시한 초과 여부만 판정 (status/source 전제 조건 없음).
 * 취소 use-case에서 상태 분기 후 시한만 단독 검증할 때 사용.
 */
export function isCancellationDeadlineExceeded(
    scheduledAt: Date,
    cancelDeadlineDays: number | null,
    now: Date = new Date(),
): boolean {
    const todayNum = toKSTDateNum(now);
    const scheduledNum = toKSTDateNum(scheduledAt);

    // 당일 불가 baseline
    if (todayNum >= scheduledNum) {
        return true;
    }

    const effectiveN = Math.max(cancelDeadlineDays ?? 1, 1);
    const deadlineNum = subDaysNum(scheduledNum, effectiveN);

    return todayNum > deadlineNum;
}
