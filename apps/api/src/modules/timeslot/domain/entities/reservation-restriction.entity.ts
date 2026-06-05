// 클래스별 예약 막기(ReservationRestriction) 도메인 엔티티 — Prisma/Nest 비의존(순수).
// 슬롯 row 가 아닌 절대 시각(storeId + startAt + programId)으로 식별된다.

export class ReservationRestriction {
    constructor(
        readonly id: string,
        readonly storeId: string,
        readonly startAt: Date,
        readonly endAt: Date,
        readonly programId: string,
        readonly createdBy: string | null,
        readonly createdAt: Date,
    ) {}
}
