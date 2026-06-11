import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreTimeSlotRepository } from '../../domain/repositories/store-time-slot.repository';
import { ReservationRestrictionRepository } from '../../domain/repositories/reservation-restriction.repository';
import { TimeslotSupportReader } from '../../domain/repositories/timeslot-support.reader';
import { kstMonthRange } from '../../../../common/date/kst-date.util';
import type {
    AvailableSlotsQueryDto,
    AvailableSlotsResponseDto,
} from '../../presentation/dto/available-slots.dto';

// 공개(User 인증) 예약 가능 시간 조회.
// 파트너 list-time-slots 와 동일 read 흐름이되, 소유권 검증 대신 공개 program→store 해석을 쓰고,
// 슬롯별 isAvailable(이 프로그램 기준 예약 가능 여부)을 가공해 반환한다.
@Injectable()
export class GetProgramAvailableSlotsUseCase {
    constructor(
        private readonly support: TimeslotSupportReader,
        private readonly slots: StoreTimeSlotRepository,
        private readonly restrictions: ReservationRestrictionRepository,
    ) {}

    async execute(
        programId: string,
        query: AvailableSlotsQueryDto,
    ): Promise<AvailableSlotsResponseDto> {
        const program = await this.support.findActiveProgramStore(programId);
        if (!program) {
            throw new BusinessException(
                'PROGRAM_NOT_FOUND',
                '클래스를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        const range = kstMonthRange(query.year, query.month);
        // 고객 노출은 OPEN 격자만. CLOSED(영업시간/격자 변경으로 닫힘)·CANCELED 슬롯은
        // 신규 예약자에게 보이지 않아야 한다(정원 마감은 status=OPEN 유지 → isAvailable=false 로 노출).
        const slots = (await this.slots.findByStore(program.storeId, { range })).filter(
            (s) => s.status === 'OPEN',
        );

        if (slots.length === 0) {
            return { slots: [] };
        }

        // 제한(ReservationRestriction)은 시각 매칭 — 이 프로그램에 걸린 startAt 집합만 추린다.
        const slotStartAts = slots.map((s) => s.startAt);
        const restrictions = await this.restrictions.findByStartAts(program.storeId, slotStartAts);
        const restrictedStartAts = new Set<number>();
        for (const r of restrictions) {
            if (r.programId === programId) {
                restrictedStartAts.add(r.startAt.getTime());
            }
        }

        const maxCapacity = program.maxCapacityPerSlot ?? 0;

        return {
            slots: slots.map((s) => {
                const remainingCount = Math.max(0, s.remainingCount(maxCapacity));
                const isRestricted = restrictedStartAts.has(s.startAt.getTime());
                const isAvailable = s.status === 'OPEN' && !isRestricted && remainingCount > 0;
                return {
                    slotId: s.id,
                    startAt: s.startAt.toISOString(),
                    endAt: s.endAt.toISOString(),
                    reservedCount: s.reservedCount,
                    remainingCount,
                    status: s.status,
                    isAvailable,
                };
            }),
        };
    }
}
