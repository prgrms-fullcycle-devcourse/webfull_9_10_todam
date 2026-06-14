import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { StoreTimeSlotRepository } from '../../domain/repositories/store-time-slot.repository';
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
    ) {}

    async execute(
        userId: string,
        storeId: string,
        dto: UpdateTimeSlotStatusDto,
    ): Promise<UpdateTimeSlotStatusResponseDto> {
        await this.ownership.verify(userId, storeId);
        const [startAtSource, endAtSource] = dto.slotKey.split('|');
        const startAt = new Date(startAtSource!);
        const endAt = new Date(endAtSource!);

        let updated;
        try {
            updated = await this.slots.setStatusByKey({
                storeId,
                startAt,
                endAt,
                status: dto.status,
                validateCurrentCandidate: dto.status !== 'OPEN',
            });
        } catch (error) {
            if (error instanceof Error && error.message === 'ACTIVE_RESERVATIONS_EXIST') {
                throw new BusinessException(
                    'ACTIVE_RESERVATIONS_EXIST',
                    '유효한 예약이 있어 슬롯을 취소할 수 없습니다.',
                    HttpStatus.CONFLICT,
                );
            }
            throw error;
        }

        this.logger.log(`[slot-status] store=${storeId} slot=${dto.slotKey} status=${dto.status}`);
        return {
            slotKey: dto.slotKey,
            status: dto.status,
            updatedAt: (updated?.updatedAt ?? new Date()).toISOString(),
        };
    }
}
