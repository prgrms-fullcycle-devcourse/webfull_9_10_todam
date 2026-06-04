import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreAccessService } from '../services/store-access.service';
import type {
    DeleteReservationRestrictionsDto,
    DeleteReservationRestrictionsResponseDto,
} from '../../presentation/dto/delete-reservation-restrictions.dto';
import { kstDayRange, parseDateOnly } from '../time.util';

@Injectable()
export class DeleteReservationRestrictionsUseCase {
    private readonly logger = new Logger(DeleteReservationRestrictionsUseCase.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storeAccess: StoreAccessService,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        dto: DeleteReservationRestrictionsDto,
    ): Promise<DeleteReservationRestrictionsResponseDto> {
        await this.storeAccess.verifyOwnership(userId, storeId);

        // (1) 개별 restrictionIds 우선 — 해당 공방 소속만 삭제.
        if (dto.restrictionIds && dto.restrictionIds.length > 0) {
            const result = await this.prisma.reservationRestriction.deleteMany({
                where: { id: { in: dto.restrictionIds }, storeId },
            });
            this.logger.log(`[restriction-remove] store=${storeId} byIds removed=${result.count}`);
            return { removedCount: result.count };
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

        const where: Prisma.ReservationRestrictionWhereInput = { storeId };

        if (dto.timeRanges && dto.timeRanges.length > 0) {
            // 지정 시각대의 startAt 들과 매칭.
            where.startAt = {
                in: dto.timeRanges.map((r) => {
                    const startAt = new Date(r.startAt);
                    if (Number.isNaN(startAt.getTime())) {
                        throw new BusinessException(
                            'INVALID_RESTRICTION_REQUEST',
                            'timeRanges 시각 형식이 올바르지 않습니다.',
                            HttpStatus.BAD_REQUEST,
                        );
                    }
                    return startAt;
                }),
            };
        } else {
            // timeRanges 미지정 → 그 날짜 전체 시각대.
            const { start, end } = kstDayRange(dateParts);
            where.startAt = { gte: start, lt: end };
        }

        if (dto.programIds && dto.programIds.length > 0) {
            where.programId = { in: dto.programIds };
        }

        const result = await this.prisma.reservationRestriction.deleteMany({ where });

        this.logger.log(
            `[restriction-remove] store=${storeId} date=${dto.date} removed=${result.count}`,
        );

        return { removedCount: result.count };
    }
}
