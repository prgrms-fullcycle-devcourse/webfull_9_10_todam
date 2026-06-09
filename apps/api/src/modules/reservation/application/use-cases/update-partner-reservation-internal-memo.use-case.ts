import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { PartnerReservationRepository } from '../../domain/repositories/partner-reservation.repository';
import type { UpdateInternalMemoResponseDto } from '../../presentation/dto/partner-reservation.dto';

@Injectable()
export class UpdatePartnerReservationInternalMemoUseCase {
    constructor(private readonly reservations: PartnerReservationRepository) {}

    async execute(
        userId: string,
        reservationId: string,
        rawMemo: string | null,
    ): Promise<UpdateInternalMemoResponseDto> {
        const row = await this.reservations.findDetail(reservationId);

        if (!row) {
            throw new BusinessException(
                'RESERVATION_NOT_FOUND',
                'Reservation was not found.',
                HttpStatus.NOT_FOUND,
            );
        }

        if (row.partnerUserId !== userId) {
            throw new BusinessException('FORBIDDEN', 'Forbidden.', HttpStatus.FORBIDDEN);
        }

        // OD-1: 빈 문자열 → null 정규화
        const memo = rawMemo === '' ? null : rawMemo;

        const updated = await this.reservations.updateInternalMemo(reservationId, memo);

        return {
            reservation: {
                id: updated.id,
                internalMemo: updated.internalMemo,
            },
        };
    }
}
