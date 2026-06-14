import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
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

        // 대상 슬롯 결정: slotKeys 지정 시 해당 가상 구간, 아니면 date 전체 구간.
        const slotKeys = (query.slotKeys ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        const windows =
            slotKeys.length > 0
                ? slotKeys.map((key) => {
                      const [startAt, endAt] = key.split('|');
                      return { startAt: new Date(startAt!), endAt: new Date(endAt!) };
                  })
                : [
                      {
                          startAt: kstDayRange(dateParts).start,
                          endAt: kstDayRange(dateParts).end,
                      },
                  ];

        // 프로그램별 CONFIRMED 예약 집계.
        const groups = await this.support.groupConfirmedByWindows(storeId, windows);
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
