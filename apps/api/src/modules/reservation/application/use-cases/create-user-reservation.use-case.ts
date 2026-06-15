import { Injectable } from '@nestjs/common';
import { NotificationCategory, ReservationStatus } from '@prisma/client';
import { NotificationService } from '../../../notification/application/services/notification.service';
import { calcDisplayState } from '../../domain/display-state.util';
import { UserReservationRepository } from '../../domain/repositories/user-reservation.repository';
import type {
    CreateUserReservationDto,
    CreateUserReservationResponseDto,
} from '../../presentation/dto/user-reservation.dto';

@Injectable()
export class CreateUserReservationUseCase {
    constructor(
        private readonly reservations: UserReservationRepository,
        private readonly notificationService: NotificationService,
    ) {}

    async execute(
        userId: string,
        dto: CreateUserReservationDto,
    ): Promise<CreateUserReservationResponseDto> {
        const result = await this.reservations.createCustomer(userId, {
            programId: dto.programId,
            slotId: dto.slotId,
            startAt: dto.startAt,
            reserverName: dto.reserverName,
            reserverPhone: dto.reserverPhone,
            participantCount: dto.participantCount,
            deliveryMethod: dto.deliveryMethod,
            requestMemo: dto.requestMemo,
        });

        const { reservation, partnerUserId } = result;
        const displayState = calcDisplayState(reservation.status);

        // P-1: 신규 PENDING 예약 생성 시 파트너에게 알림 (수동확정 공방만 — autoConfirm=false)
        // 트랜잭션 커밋 이후 side-effect — 발송 실패가 상태 롤백 유발 금지 (plan §2)
        if (reservation.status === ReservationStatus.PENDING && partnerUserId) {
            await this.notificationService.createAndDispatch({
                recipientId: partnerUserId,
                reservationId: reservation.id,
                eventType: 'P-1',
                category: NotificationCategory.OPERATION,
                title: '새 예약 요청',
                body: '새 예약 요청이 있어요. 확인해 주세요.',
                deepLink: `/partner/reservations/${reservation.id}`,
                idempotencyKey: `P-1:${reservation.id}:${partnerUserId}`,
            });
        }

        // 자동확정 공방: 생성 즉시 CONFIRMED → 고객·파트너 모두에게 알림.
        if (reservation.status === ReservationStatus.CONFIRMED) {
            // U-1: 예약한 고객에게 예약 확정 알림 (수동확정 U-1과 동일 문구).
            await this.notificationService.createAndDispatch({
                recipientId: userId,
                reservationId: reservation.id,
                eventType: 'U-1',
                category: NotificationCategory.TRANSACTION,
                title: '예약 확정',
                body: '예약이 확정되었어요. 공방에서 곧 만나요!',
                deepLink: `/my/reservations/${reservation.id}`,
                idempotencyKey: `U-1:${reservation.id}:${userId}`,
            });

            // P-4: 자동확정 공방 파트너에게 예약이 자동 확정됐음을 알림.
            if (partnerUserId) {
                await this.notificationService.createAndDispatch({
                    recipientId: partnerUserId,
                    reservationId: reservation.id,
                    eventType: 'P-4',
                    category: NotificationCategory.OPERATION,
                    title: '예약 자동 확정',
                    body: '새 예약이 자동 확정됐어요. 예약 내용을 확인해 주세요.',
                    deepLink: `/partner/reservations/${reservation.id}`,
                    idempotencyKey: `P-4:${reservation.id}:${partnerUserId}`,
                });
            }
        }

        return {
            reservation: {
                id: reservation.id,
                programId: reservation.programId,
                slotId: reservation.storeTimeSlotId,
                reserverName: reservation.reserverName,
                participantCount: reservation.participantCount,
                status: reservation.status,
                displayState,
                createdAt: reservation.createdAt.toISOString(),
            },
        };
    }
}
