import { HttpStatus, Injectable } from '@nestjs/common';
import { NotificationCategory } from '@prisma/client';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { NotificationService } from '../../../notification/application/services/notification.service';
import { PartnerReservationRepository } from '../../domain/repositories/partner-reservation.repository';
import { PartnerReservationPolicy } from '../../domain/services/partner-reservation-policy.service';
import type { PartnerReservationStatusResponseDto } from '../../presentation/dto/partner-reservation.dto';
import { findPartnerReservationForAction } from './partner-reservation-action-access';

@Injectable()
export class ConfirmPartnerReservationUseCase {
    constructor(
        private readonly reservations: PartnerReservationRepository,
        private readonly notificationService: NotificationService,
    ) {}

    async execute(
        userId: string,
        reservationId: string,
    ): Promise<PartnerReservationStatusResponseDto> {
        const reservation = await findPartnerReservationForAction(
            this.reservations,
            userId,
            reservationId,
        );
        if (!PartnerReservationPolicy.canConfirm(reservation.status)) {
            throw new BusinessException(
                'INVALID_RESERVATION_STATUS',
                'Reservation is not pending.',
                HttpStatus.CONFLICT,
            );
        }

        const updated = await this.reservations.confirm(reservation);

        // U-1: PENDING→CONFIRMED 시 고객에게 알림 (plan §4 U-1, 정책 §4.1)
        // 트랜잭션 커밋 이후 side-effect — 발송 실패가 상태 롤백 유발 금지 (plan §2)
        if (reservation.customerUserId) {
            await this.notificationService.createAndDispatch({
                recipientId: reservation.customerUserId,
                reservationId,
                eventType: 'U-1',
                category: NotificationCategory.TRANSACTION,
                title: '예약 확정',
                body: '예약이 확정됐어요. 작품 제작이 시작됩니다.',
                deepLink: `/reservations/${reservationId}`,
                idempotencyKey: `U-1:${reservationId}:${reservation.customerUserId}`,
            });
        }

        return {
            reservation: {
                id: updated.reservation.id,
                status: updated.reservation.status,
                artworkId: updated.artwork.id,
                updatedAt: updated.reservation.updatedAt.toISOString(),
            },
        };
    }
}
