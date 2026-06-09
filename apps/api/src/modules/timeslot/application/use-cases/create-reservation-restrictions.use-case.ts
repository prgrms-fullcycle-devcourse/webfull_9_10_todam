import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { StoreTimeSlotRepository } from '../../domain/repositories/store-time-slot.repository';
import {
    NewRestriction,
    ReservationRestrictionRepository,
} from '../../domain/repositories/reservation-restriction.repository';
import { TimeslotSupportReader } from '../../domain/repositories/timeslot-support.reader';
import { kstDayRange, parseDateOnly } from '../../../../common/date/kst-date.util';
import type {
    CreateReservationRestrictionsDto,
    CreateReservationRestrictionsResponseDto,
} from '../../presentation/dto/create-reservation-restrictions.dto';

@Injectable()
export class CreateReservationRestrictionsUseCase {
    private readonly logger = new Logger(CreateReservationRestrictionsUseCase.name);

    constructor(
        private readonly ownership: StoreOwnershipService,
        private readonly slots: StoreTimeSlotRepository,
        private readonly restrictions: ReservationRestrictionRepository,
        private readonly support: TimeslotSupportReader,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        dto: CreateReservationRestrictionsDto,
    ): Promise<CreateReservationRestrictionsResponseDto> {
        await this.ownership.verify(userId, storeId);

        const dateParts = parseDateOnly(dto.date);
        if (!dateParts) {
            throw new BusinessException(
                'INVALID_RESTRICTION_REQUEST',
                'date 형식이 올바르지 않습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // 대상 프로그램이 해당 공방 소속인지 검증.
        const ownedProgramIds = await this.support.findOwnedProgramIds(storeId, dto.programIds);
        if (ownedProgramIds.length !== new Set(dto.programIds).size) {
            throw new BusinessException(
                'RESOURCE_NOT_FOUND',
                '공방에 속하지 않은 프로그램이 포함되어 있습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 대상 시각대(timeRanges) 결정.
        const ranges = await this.resolveTimeRanges(storeId, dto, dateParts);
        if (ranges.length === 0) {
            throw new BusinessException(
                'INVALID_RESTRICTION_REQUEST',
                '막을 시간대가 없습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // (시각대) × (프로그램) 멱등 생성.
        const items: NewRestriction[] = [];
        for (const range of ranges) {
            for (const programId of dto.programIds) {
                items.push({
                    storeId,
                    startAt: range.startAt,
                    endAt: range.endAt,
                    programId,
                    createdBy: userId,
                });
            }
        }
        const created = await this.restrictions.createManyIdempotent(items);

        this.logger.log(
            `[restriction-apply] store=${storeId} date=${dto.date} scope=${dto.scope} applied=${created.length}`,
        );

        return {
            appliedCount: created.length,
            restrictions: created.map((r) => ({
                id: r.id,
                startAt: r.startAt.toISOString(),
                endAt: r.endAt.toISOString(),
                programId: r.programId,
            })),
        };
    }

    // scope=ALL_DAY: 그 날짜 슬롯들의 startAt/endAt 로 확장.
    // scope=TIME_SLOTS: timeRanges[] 사용.
    private async resolveTimeRanges(
        storeId: string,
        dto: CreateReservationRestrictionsDto,
        dateParts: { year: number; month: number; day: number },
    ): Promise<{ startAt: Date; endAt: Date }[]> {
        if (dto.scope === 'ALL_DAY') {
            const range = kstDayRange(dateParts);
            const slots = await this.slots.findByStore(storeId, { range });
            return slots.map((s) => ({ startAt: s.startAt, endAt: s.endAt }));
        }

        // TIME_SLOTS
        if (!dto.timeRanges || dto.timeRanges.length === 0) {
            throw new BusinessException(
                'INVALID_RESTRICTION_REQUEST',
                'scope가 TIME_SLOTS이면 timeRanges가 필요합니다.',
                HttpStatus.BAD_REQUEST,
            );
        }
        return dto.timeRanges.map((r) => {
            const startAt = new Date(r.startAt);
            const endAt = new Date(r.endAt);
            if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
                throw new BusinessException(
                    'INVALID_RESTRICTION_REQUEST',
                    'timeRanges 시각 형식이 올바르지 않습니다.',
                    HttpStatus.BAD_REQUEST,
                );
            }
            return { startAt, endAt };
        });
    }
}
