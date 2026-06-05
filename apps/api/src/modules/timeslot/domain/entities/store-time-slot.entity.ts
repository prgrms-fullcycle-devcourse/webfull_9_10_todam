// 타임슬롯 도메인 엔티티 — Prisma/Nest 비의존(순수).
// 영속 계층(Prisma row)과의 변환은 infrastructure/persistence 의 mapper 가 담당한다.

// 슬롯 상태의 단일 진실원천(SSOT)은 FE 와 공유하는 @todam/shared 의 StoreTimeSlotStatus.
// 타입만 import → 컴파일 후 소멸하므로 런타임 의존 없음(도메인은 런타임 패키지 비의존 유지).
import type { StoreTimeSlotStatus } from '@todam/shared/src/enums/store-time-slot-status';

export type TimeSlotStatus = `${StoreTimeSlotStatus}`;

// 런타임 허용값(class-validator/Swagger 검증용).
// satisfies Record<TimeSlotStatus, true> 로 shared enum 과 정확히 일치하도록 컴파일타임에 강제 —
// shared 에 상태가 추가/제거되면 여기서 컴파일 에러가 나 동기화가 깨지지 않는다.
const STATUS_PRESENCE = {
    OPEN: true,
    CLOSED: true,
    CANCELED: true,
} satisfies Record<TimeSlotStatus, true>;
export const TIME_SLOT_STATUS_VALUES = Object.keys(STATUS_PRESENCE) as TimeSlotStatus[];

export class StoreTimeSlot {
    constructor(
        readonly id: string,
        readonly storeId: string,
        readonly startAt: Date,
        readonly endAt: Date,
        readonly reservedCount: number,
        readonly status: TimeSlotStatus,
        readonly createdAt: Date,
        readonly updatedAt: Date,
    ) {}

    /** 공방 단위 정원(maxCapacityPerSlot) 기준 잔여 정원. 컬럼이 아닌 가공값. */
    remainingCount(maxCapacityPerSlot: number): number {
        return maxCapacityPerSlot - this.reservedCount;
    }

    /** CANCELED 전환 가능 여부 판정에 쓰는 헬퍼(활성 예약 존재는 외부에서 확인). */
    isCanceled(): boolean {
        return this.status === 'CANCELED';
    }
}
