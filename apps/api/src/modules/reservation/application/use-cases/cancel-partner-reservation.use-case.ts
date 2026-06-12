import { HttpStatus, Injectable } from '@nestjs/common';
import { NotificationCategory, ReservationStatus } from '@prisma/client';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { NotificationService } from '../../../notification/application/services/notification.service';
import { PartnerReservationRepository } from '../../domain/repositories/partner-reservation.repository';
import { PartnerReservationPolicy } from '../../domain/services/partner-reservation-policy.service';
import type {
    CancelPartnerReservationDto,
    PartnerReservationStatusResponseDto,
} from '../../presentation/dto/partner-reservation.dto';
import { findPartnerReservationForAction } from './partner-reservation-action-access';

@Injectable()
export class CancelPartnerReservationUseCase {
    constructor(
        private readonly reservations: PartnerReservationRepository,
        private readonly notificationService: NotificationService,
    ) {}

    async execute(
        userId: string,
        reservationId: string,
        dto: CancelPartnerReservationDto,
    ): Promise<PartnerReservationStatusResponseDto> {
        const reservation = await findPartnerReservationForAction(
            this.reservations,
            userId,
            reservationId,
        );
        if (!PartnerReservationPolicy.canCancel(reservation.status)) {
            throw new BusinessException(
                'INVALID_RESERVATION_STATUS',
                'Reservation cannot be canceled.',
                HttpStatus.CONFLICT,
            );
        }

        // 취소 전 status 저장 (알림 분기에 사용)
        const prevStatus = reservation.status;

        const updated = await this.reservations.cancel(reservation, userId, dto.cancelReason);

        // U-2/U-3: 파트너 취소 시 고객에게 알림 (plan §4 U-2/U-3, 정책 §4.1)
        // - U-2: PENDING→CANCELED, U-3: CONFIRMED→CANCELED
        // 트랜잭션 커밋 이후 side-effect — 발송 실패가 상태 롤백 유발 금지 (plan §2)
        if (reservation.customerUserId) {
            const eventType = prevStatus === ReservationStatus.PENDING ? 'U-2' : 'U-3';
            const body =
                prevStatus === ReservationStatus.PENDING
                    ? '공방 사정으로 예약이 취소됐어요.'
                    : '예약이 취소됐어요.';
            await this.notificationService.createAndDispatch({
                recipientId: reservation.customerUserId,
                reservationId,
                eventType,
                category: NotificationCategory.TRANSACTION,
                title: '예약 취소',
                body,
                deepLink: `/my/reservations/${reservationId}`,
                idempotencyKey: `${eventType}:${reservationId}:${reservation.customerUserId}`,
            });
        }

        return {
            reservation: {
                id: updated.id,
                status: updated.status,
                canceledBy: updated.canceledBy,
                cancelReason: updated.cancelReason,
                canceledAt: updated.canceledAt?.toISOString() ?? null,
            },
        };
    }
}
