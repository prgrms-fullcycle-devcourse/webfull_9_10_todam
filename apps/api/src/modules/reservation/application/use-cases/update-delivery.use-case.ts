import { HttpStatus, Injectable } from '@nestjs/common';
import { ReservationDeliveryMethod, ReservationStatus } from '@prisma/client';
import type { DeliveryEditRequest } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { UserReservationRepository } from '../../domain/repositories/user-reservation.repository';
import type { DeliveryEditResponseDto } from '../../presentation/dto/user-reservation.dto';

/** PATCH /reservations/:reservationId/delivery — 배송 정보 등록·수정 */
@Injectable()
export class UpdateDeliveryUseCase {
    constructor(private readonly reservations: UserReservationRepository) {}

    async execute(
        currentUserId: string,
        reservationId: string,
        input: DeliveryEditRequest,
    ): Promise<DeliveryEditResponseDto> {
        // 1. 예약 조회
        const row = await this.reservations.findReservationForDelivery(reservationId);

        if (!row) {
            throw new BusinessException(
                'RESERVATION_NOT_FOUND',
                '예약을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 2. 본인 가드 — userId=null(PARTNER_MANUAL) 포함 모두 403
        if (row.userId !== currentUserId) {
            throw new BusinessException(
                'FORBIDDEN',
                '본인 예약의 배송 정보만 수정할 수 있습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // 3. 픽업 예약 차단
        if (row.deliveryMethod !== ReservationDeliveryMethod.DELIVERY) {
            throw new BusinessException(
                'PICKUP_NOT_ALLOWED',
                '픽업 예약은 배송 정보를 수정할 수 없습니다.',
                HttpStatus.CONFLICT,
            );
        }

        // 4. 잠금 기준 — SHIPPED·DELIVERED 상태이면 수정 불가
        if (
            row.status === ReservationStatus.SHIPPED ||
            row.status === ReservationStatus.DELIVERED
        ) {
            throw new BusinessException(
                'DELIVERY_NOT_EDITABLE',
                '이미 발송된 작품의 배송 정보는 수정할 수 없습니다.',
                HttpStatus.CONFLICT,
            );
        }

        // 5. upsert (body는 BodyZodValidationPipe가 미리 검증)
        const delivery = await this.reservations.upsertDelivery(reservationId, input);

        return { delivery };
    }
}
