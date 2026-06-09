import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { StoreTimeSlotRepository } from '../../domain/repositories/store-time-slot.repository';
import { TimeslotSupportReader } from '../../domain/repositories/timeslot-support.reader';
import { kstDayRange, parseDateOnly } from '../../../../common/date/kst-date.util';
import type {
    ProgramReservationCountsQueryDto,
    ProgramReservationCountsResponseDto,
} from '../../presentation/dto/program-reservation-counts.dto';

@Injectable()
export class GetProgramReservationCountsUseCase {
    constructor(
        private readonly ownership: StoreOwnershipService,
        private readonly slots: StoreTimeSlotRepository,
        private readonly support: TimeslotSupportReader,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        query: ProgramReservationCountsQueryDto,
    ): Promise<ProgramReservationCountsResponseDto> {
        await this.ownership.verify(userId, storeId);

        const dateParts = parseDateOnly(query.date);
        if (!dateParts) {
            throw new BusinessException(
                'INVALID_DATE_FORMAT',
                'date 형식이 올바르지 않습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // 대상 슬롯 결정: timeSlotIds 지정 시 그 슬롯들, 아니면 date 전체 슬롯.
        const slotIds = (query.timeSlotIds ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        const targetSlots =
            slotIds.length > 0
                ? await this.slots.findByIds(storeId, slotIds)
                : await this.slots.findByStore(storeId, { range: kstDayRange(dateParts) });
        const targetSlotIds = targetSlots.map((s) => s.id);

        if (targetSlotIds.length === 0) {
            return { programs: [] };
        }

        // 프로그램별 CONFIRMED 예약 집계.
        const groups = await this.support.groupConfirmedByProgram(storeId, targetSlotIds);
        if (groups.length === 0) {
            return { programs: [] };
        }

        const nameById = await this.support.findProgramNames(groups.map((g) => g.programId));

        return {
            programs: groups.map((g) => ({
                programId: g.programId,
                programName: nameById.get(g.programId) ?? '',
                confirmedReservationCount: g.count,
            })),
        };
    }
}
