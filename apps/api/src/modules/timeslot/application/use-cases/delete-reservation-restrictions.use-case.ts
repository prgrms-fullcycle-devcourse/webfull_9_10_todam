import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import {
    DeleteRestrictionConditions,
    ReservationRestrictionRepository,
} from '../../domain/repositories/reservation-restriction.repository';
import { kstDayRange, parseDateOnly } from '../../../../common/date/kst-date.util';
import type {
    DeleteReservationRestrictionsDto,
    DeleteReservationRestrictionsResponseDto,
} from '../../presentation/dto/delete-reservation-restrictions.dto';

@Injectable()
export class DeleteReservationRestrictionsUseCase {
    private readonly logger = new Logger(DeleteReservationRestrictionsUseCase.name);

    constructor(
        private readonly ownership: StoreOwnershipService,
        private readonly restrictions: ReservationRestrictionRepository,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        dto: DeleteReservationRestrictionsDto,
    ): Promise<DeleteReservationRestrictionsResponseDto> {
        await this.ownership.verify(userId, storeId);

        // (1) 개별 restrictionIds 우선 — 해당 공방 소속만 삭제.
        if (dto.restrictionIds && dto.restrictionIds.length > 0) {
            const removedCount = await this.restrictions.deleteByIds(storeId, dto.restrictionIds);
            this.logger.log(`[restriction-remove] store=${storeId} byIds removed=${removedCount}`);
            return { removedCount };
        }

        // (2) 조건 매칭(시각 기반): date + (timeRanges?) + programIds?.
        if (!dto.date) {
            throw new BusinessException(
                'INVALID_RESTRICTION_REQUEST',
                'date 또는 restrictionIds가 필요합니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const dateParts = parseDateOnly(dto.date);
        if (!dateParts) {
            throw new BusinessException(
                'INVALID_RESTRICTION_REQUEST',
                'date 형식이 올바르지 않습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const conditions: DeleteRestrictionConditions = {};

        if (dto.timeRanges && dto.timeRanges.length > 0) {
            // 지정 시각대의 startAt/endAt 쌍과 매칭.
            const dayRange = kstDayRange(dateParts);
            conditions.timeRanges = dto.timeRanges.map((r) => {
                const startAt = new Date(r.startAt);
                const endAt = new Date(r.endAt);
                if (
                    Number.isNaN(startAt.getTime()) ||
                    Number.isNaN(endAt.getTime()) ||
                    startAt < dayRange.start ||
                    endAt > dayRange.end
                ) {
                    throw new BusinessException(
                        'INVALID_RESTRICTION_REQUEST',
                        'timeRanges는 요청 date 범위 안에 있어야 합니다.',
                        HttpStatus.BAD_REQUEST,
                    );
                }
                return { startAt, endAt };
            });
        } else {
            // timeRanges 미지정 → 그 날짜 전체 시각대.
            conditions.range = kstDayRange(dateParts);
        }

        if (dto.programIds && dto.programIds.length > 0) {
            conditions.programIds = dto.programIds;
        }

        const removedCount = await this.restrictions.deleteByConditions(storeId, conditions);

        this.logger.log(
            `[restriction-remove] store=${storeId} date=${dto.date} removed=${removedCount}`,
        );

        return { removedCount };
    }
}
