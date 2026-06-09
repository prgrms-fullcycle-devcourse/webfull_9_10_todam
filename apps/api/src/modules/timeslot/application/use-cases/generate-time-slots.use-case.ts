import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { StoreTimeSlotRepository } from '../../domain/repositories/store-time-slot.repository';
import { TimeslotSupportReader } from '../../domain/repositories/timeslot-support.reader';
import { TimeSlotGenerationService } from '../../domain/services/time-slot-generation.service';
import { kstWallClockToInstant, parseDateOnly } from '../../../../common/date/kst-date.util';
import type {
    GenerateTimeSlotsDto,
    GenerateTimeSlotsResponseDto,
} from '../../presentation/dto/generate-time-slots.dto';

@Injectable()
export class GenerateTimeSlotsUseCase {
    private readonly logger = new Logger(GenerateTimeSlotsUseCase.name);

    constructor(
        private readonly ownership: StoreOwnershipService,
        private readonly slots: StoreTimeSlotRepository,
        private readonly support: TimeslotSupportReader,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        dto: GenerateTimeSlotsDto,
    ): Promise<GenerateTimeSlotsResponseDto> {
        const startParts = parseDateOnly(dto.startDate);
        const endParts = parseDateOnly(dto.endDate);

        if (!startParts || !endParts) {
            throw new BusinessException(
                'INVALID_DATE_RANGE',
                '날짜 형식이 올바르지 않습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const startKey = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
        const endKey = Date.UTC(endParts.year, endParts.month - 1, endParts.day);
        if (startKey > endKey) {
            throw new BusinessException(
                'INVALID_DATE_RANGE',
                'startDate는 endDate보다 이후일 수 없습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const store = await this.ownership.verify(userId, storeId);

        if (store.reservationIntervalMinutes == null || store.reservationIntervalMinutes <= 0) {
            throw new BusinessException(
                'INTERVAL_NOT_CONFIGURED',
                '예약 간격(reservationIntervalMinutes)이 설정되지 않았습니다.',
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }
        const interval = store.reservationIntervalMinutes;

        const operatingHours = await this.support.findOperatingHours(storeId);
        if (operatingHours.length === 0) {
            throw new BusinessException(
                'OPERATING_HOURS_NOT_SET',
                '영업시간이 설정되지 않았습니다.',
                HttpStatus.CONFLICT,
            );
        }

        const now = Date.now();
        const { candidates, pastSkipped, anyOperatingDay } =
            TimeSlotGenerationService.buildCandidates({
                interval,
                operatingHours,
                startParts,
                endParts,
                now,
            });

        if (!anyOperatingDay) {
            throw new BusinessException(
                'OPERATING_HOURS_NOT_SET',
                '생성 범위 내 운영 요일이 없습니다.',
                HttpStatus.CONFLICT,
            );
        }

        // 생성 범위의 절대 시각 윈도우([startDate 00:00 KST, endDate 24:00 KST)).
        const window = {
            start: kstWallClockToInstant(startParts, 0),
            end: kstWallClockToInstant(endParts, 24 * 60),
        };

        const result = await this.slots.applyGeneratedGrid({
            storeId,
            candidates,
            window,
            now: new Date(now),
        });

        const skippedCount = pastSkipped + result.alreadyExisting;

        this.logger.log(
            `[generate] store=${storeId} range=${dto.startDate}~${dto.endDate} created=${result.created.length} removed=${result.removedCount} skipped=${skippedCount}(past=${pastSkipped},existing=${result.alreadyExisting})`,
        );

        return {
            createdCount: result.created.length,
            removedCount: result.removedCount,
            skippedCount,
            createdSlots: result.created
                .slice()
                .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
                .map((s) => ({
                    slotId: s.id,
                    startAt: s.startAt.toISOString(),
                    endAt: s.endAt.toISOString(),
                    status: s.status,
                    reservedCount: s.reservedCount,
                })),
        };
    }
}
