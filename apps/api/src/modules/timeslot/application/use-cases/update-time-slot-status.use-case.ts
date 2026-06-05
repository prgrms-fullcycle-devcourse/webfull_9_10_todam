import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { TimeSlotStatus } from '../../domain/entities/store-time-slot.entity';
import { StoreTimeSlotRepository } from '../../domain/repositories/store-time-slot.repository';
import { TimeslotSupportReader } from '../../domain/repositories/timeslot-support.reader';
import type {
    UpdateTimeSlotStatusDto,
    UpdateTimeSlotStatusResponseDto,
} from '../../presentation/dto/update-time-slot-status.dto';

@Injectable()
export class UpdateTimeSlotStatusUseCase {
    private readonly logger = new Logger(UpdateTimeSlotStatusUseCase.name);

    constructor(
        private readonly ownership: StoreOwnershipService,
        private readonly slots: StoreTimeSlotRepository,
        private readonly support: TimeslotSupportReader,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        timeSlotId: string,
        dto: UpdateTimeSlotStatusDto,
    ): Promise<UpdateTimeSlotStatusResponseDto> {
        await this.ownership.verify(userId, storeId);

        const slot = await this.slots.findById(timeSlotId);
        if (!slot || slot.storeId !== storeId) {
            throw new BusinessException(
                'SLOT_NOT_FOUND',
                '타임슬롯을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        const next = dto.status as TimeSlotStatus;

        // CANCELED 전환 시에만 유효 예약(PENDING|CONFIRMED) 가드.
        if (next === 'CANCELED') {
            const activeCount = await this.support.countActiveReservations(timeSlotId);
            if (activeCount > 0) {
                throw new BusinessException(
                    'ACTIVE_RESERVATIONS_EXIST',
                    '유효한 예약이 있어 슬롯을 취소할 수 없습니다.',
                    HttpStatus.CONFLICT,
                );
            }
        }
        // CLOSED(막기)/OPEN(재오픈)은 예약 존재 여부와 무관하게 허용.

        const updated = await this.slots.updateStatus(timeSlotId, next);

        this.logger.log(`[slot-status] store=${storeId} slot=${timeSlotId} status=${next}`);

        return {
            slotId: updated.id,
            status: updated.status,
            updatedAt: updated.updatedAt.toISOString(),
        };
    }
}
