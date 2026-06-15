import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { kstMonthRange } from '../../../../common/date/kst-date.util';
import { TimeSlotBlockRepository } from '../../domain/repositories/time-slot-block.repository';
import { ReservationRestrictionRepository } from '../../domain/repositories/reservation-restriction.repository';
import { TimeslotSupportReader } from '../../domain/repositories/timeslot-support.reader';
import { TimeSlotGenerationService } from '../../domain/services/time-slot-generation.service';
import { evaluateVirtualSlot, slotKey } from '../../domain/services/virtual-time-slot.service';
import type {
    AvailableSlotsQueryDto,
    AvailableSlotsResponseDto,
} from '../../presentation/dto/available-slots.dto';

@Injectable()
export class GetProgramAvailableSlotsUseCase {
    constructor(
        private readonly support: TimeslotSupportReader,
        private readonly blocks: TimeSlotBlockRepository,
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
        if (!program.reservationIntervalMinutes || !program.maxCapacityPerSlot) {
            return { slots: [] };
        }

        const range = kstMonthRange(query.year, query.month);
        const operatingHours = await this.support.findOperatingHours(program.storeId);
        const lastDay = new Date(Date.UTC(query.year, query.month, 0)).getUTCDate();
        const { candidates } = TimeSlotGenerationService.buildCandidates({
            interval: program.reservationIntervalMinutes,
            operatingHours,
            startParts: { year: query.year, month: query.month, day: 1 },
            endParts: { year: query.year, month: query.month, day: lastDay },
            now: Date.now(),
        });

        const [reservations, blockedSlots, restrictions] = await Promise.all([
            this.support.findActiveReservationWindows(program.storeId, range),
            this.blocks.findOverlapping(program.storeId, range),
            this.restrictions.findOverlapping(program.storeId, range),
        ]);
        const blockedWindows = [
            ...blockedSlots,
            ...restrictions.filter((restriction) => restriction.programId === programId),
        ];

        return {
            slots: candidates.flatMap((candidate) => {
                const isClosed = blockedSlots.some(
                    (slot) => slot.startAt < candidate.endAt && candidate.startAt < slot.endAt,
                );
                if (isClosed) return [];
                const state = evaluateVirtualSlot(
                    candidate,
                    reservations,
                    blockedWindows,
                    program.maxCapacityPerSlot!,
                );
                return [
                    {
                        slotKey: slotKey(candidate),
                        startAt: candidate.startAt.toISOString(),
                        endAt: candidate.endAt.toISOString(),
                        reservedCount: state.reservedCount,
                        remainingCount: state.remainingCount,
                        status: 'OPEN' as const,
                        isAvailable: state.isAvailable,
                    },
                ];
            }),
        };
    }
}
