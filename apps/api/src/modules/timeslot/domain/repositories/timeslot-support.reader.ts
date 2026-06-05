// 교차 집계 read 포트(추상 클래스 = DI 토큰).
//
// ⚠️ 전환 부채(transitional): timeslot 외 테이블(StoreOperatingHour / Reservation / Program)을
// 읽는다. 파일럿 단계에서는 timeslot infrastructure 가 Prisma 로 직접 구현하고,
// store/program/reservation 모듈이 DDD 전환되면 각 모듈이 노출하는 read 포트로 분해·수렴한다.

import { OperatingHourInput } from '../services/time-slot-generation.service';

export interface ProgramConfirmedCount {
    programId: string;
    count: number;
}

export abstract class TimeslotSupportReader {
    /** [store] 요일별 영업시간(생성용). */
    abstract findOperatingHours(storeId: string): Promise<OperatingHourInput[]>;

    /** [reservation] 슬롯별 CONFIRMED 예약 수(목록 표시용). slotId → count. */
    abstract countConfirmedBySlotIds(
        storeId: string,
        slotIds: string[],
    ): Promise<Map<string, number>>;

    /** [reservation] 슬롯의 활성 예약(PENDING|CONFIRMED) 수(슬롯 CANCELED 가드용). */
    abstract countActiveReservations(slotId: string): Promise<number>;

    /** [reservation] 대상 슬롯들의 프로그램별 CONFIRMED 집계(막기 대상 선택 지원). */
    abstract groupConfirmedByProgram(
        storeId: string,
        slotIds: string[],
    ): Promise<ProgramConfirmedCount[]>;

    /** [program] programIds 중 해당 공방 소속인 것만 반환(소속 검증용). */
    abstract findOwnedProgramIds(storeId: string, programIds: string[]): Promise<string[]>;

    /** [program] programId → title 매핑(집계 응답 이름 표시용). */
    abstract findProgramNames(programIds: string[]): Promise<Map<string, string>>;
}
