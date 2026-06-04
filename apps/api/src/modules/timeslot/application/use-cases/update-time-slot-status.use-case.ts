import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { StoreTimeSlotStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { verifyStoreOwnership } from '../verify-store-ownership';
import type {
    UpdateTimeSlotStatusDto,
    UpdateTimeSlotStatusResponseDto,
} from '../../presentation/dto/update-time-slot-status.dto';

@Injectable()
export class UpdateTimeSlotStatusUseCase {
    private readonly logger = new Logger(UpdateTimeSlotStatusUseCase.name);

    constructor(private readonly prisma: PrismaService) {}

    async execute(
        userId: string,
        storeId: string,
        timeSlotId: string,
        dto: UpdateTimeSlotStatusDto,
    ): Promise<UpdateTimeSlotStatusResponseDto> {
        await verifyStoreOwnership(this.prisma, userId, storeId);

        const slot = await this.prisma.storeTimeSlot.findUnique({
            where: { id: timeSlotId },
            select: { id: true, storeId: true, status: true },
        });

        if (!slot || slot.storeId !== storeId) {
            throw new BusinessException(
                'SLOT_NOT_FOUND',
                '타임슬롯을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        const next = dto.status as StoreTimeSlotStatus;

        // CANCELED 전환 시에만 유효 예약(PENDING|CONFIRMED) 가드.
        if (next === 'CANCELED') {
            const activeCount = await this.prisma.reservation.count({
                where: {
                    storeTimeSlotId: timeSlotId,
                    status: { in: ['PENDING', 'CONFIRMED'] },
                },
            });
            if (activeCount > 0) {
                throw new BusinessException(
                    'ACTIVE_RESERVATIONS_EXIST',
                    '유효한 예약이 있어 슬롯을 취소할 수 없습니다.',
                    HttpStatus.CONFLICT,
                );
            }
        }
        // CLOSED(막기)/OPEN(재오픈)은 예약 존재 여부와 무관하게 허용.

        const updated = await this.prisma.storeTimeSlot.update({
            where: { id: timeSlotId },
            data: { status: next },
            select: { id: true, status: true, updatedAt: true },
        });

        this.logger.log(`[slot-status] store=${storeId} slot=${timeSlotId} status=${next}`);

        return {
            slotId: updated.id,
            status: updated.status,
            updatedAt: updated.updatedAt.toISOString(),
        };
    }
}
