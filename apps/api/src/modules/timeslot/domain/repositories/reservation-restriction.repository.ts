// ReservationRestriction 영속 포트(추상 클래스 = DI 토큰).
// 구현은 infrastructure/persistence/prisma-reservation-restriction.repository.ts.

import { ReservationRestriction } from '../entities/reservation-restriction.entity';

export interface NewRestriction {
    storeId: string;
    startAt: Date;
    endAt: Date;
    programId: string;
    createdBy: string | null;
}

export interface DeleteRestrictionConditions {
    /** 지정 시각대(startAt) 매칭 삭제. */
    startAts?: Date[];
    /** 날짜 범위 [start, end) 매칭 삭제(시각대 미지정 시). */
    range?: { start: Date; end: Date };
    /** 프로그램 한정. */
    programIds?: string[];
}

export abstract class ReservationRestrictionRepository {
    /** 슬롯 startAt 들과 매칭되는 제한 조회(목록의 restrictedProgramIds 계산용). */
    abstract findByStartAts(storeId: string, startAts: Date[]): Promise<ReservationRestriction[]>;

    /** (storeId, startAt, programId) 멱등 생성 — 이미 있으면 스킵, 신규만 반환. 트랜잭션. */
    abstract createManyIdempotent(items: NewRestriction[]): Promise<ReservationRestriction[]>;

    /** 개별 id 삭제(해당 공방 소속만). 삭제 건수 반환. */
    abstract deleteByIds(storeId: string, ids: string[]): Promise<number>;

    /** 조건(시각대/날짜범위 + 프로그램) 매칭 삭제. 삭제 건수 반환. */
    abstract deleteByConditions(
        storeId: string,
        conditions: DeleteRestrictionConditions,
    ): Promise<number>;
}
