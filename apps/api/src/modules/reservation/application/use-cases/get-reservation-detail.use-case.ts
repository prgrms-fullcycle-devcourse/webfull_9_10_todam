import { HttpStatus, Injectable } from '@nestjs/common';
import { ArtworkStatus, ReservationStatus } from '@prisma/client';
import {
    ReservationDeliveryMethod,
    type ReservationDeliveryMethod as ReservationDeliveryMethodValue,
    type ReservationDetailArtwork,
    type ReservationDetailDelivery,
} from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { calcDisplayState } from '../../domain/display-state.util';
import { canCancelReservation } from '../../domain/cancellation-policy';
import { UserReservationRepository } from '../../domain/repositories/user-reservation.repository';
import type { ReservationDetailResponseDto } from '../../presentation/dto/user-reservation.dto';

// 4단계(firing) 순서. ARTWORK_SEQUENCE import 대신 직접 정의해 인덱스 기반 계산.
// plan의 "방식 A" 의사코드: STAGE_INDEX = { DRYING:1, BISQUE_FIRING:2, GLAZING:3, GLAZE_FIRING:4 }
const STAGE_INDEX: Partial<Record<ArtworkStatus, number>> = {
    [ArtworkStatus.DRYING]: 1,
    [ArtworkStatus.BISQUE_FIRING]: 2,
    [ArtworkStatus.GLAZING]: 3,
    [ArtworkStatus.GLAZE_FIRING]: 4,
} as const;
const FIRING_TOTAL = 4;

@Injectable()
export class GetReservationDetailUseCase {
    constructor(private readonly reservations: UserReservationRepository) {}

    async execute(
        currentUserId: string,
        reservationId: string,
    ): Promise<ReservationDetailResponseDto> {
        // 1. 예약 조회
        const row = await this.reservations.findDetail(reservationId);

        if (!row) {
            throw new BusinessException(
                'RESERVATION_NOT_FOUND',
                '예약을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 2. 본인 가드 — userId=null(PARTNER_MANUAL) 도 403
        if (row.userId !== currentUserId) {
            throw new BusinessException(
                'FORBIDDEN',
                '해당 예약에 대한 접근 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // 3. displayState
        const displayState = calcDisplayState(row.status, row.artworkStatus);

        // 4. totalPrice
        const totalPrice = row.programSnapshotPrice * row.participantCount;

        // 5. canCancel — 공용 도메인 정책(cancellation-policy.ts) 사용
        const canCancel = canCancelReservation(
            row.status,
            row.source,
            row.scheduledAt,
            row.cancelDeadlineDays,
        );

        // 5-1. 종료 시각 = 시작 + 코스 소요 시간(durationMinutes). 슬롯 간격(StoreTimeSlot)과 무관하게
        // 실제 코스 길이를 노출해 시작~종료 범위 표시에 사용한다.
        const scheduledEndAt = new Date(row.scheduledAt.getTime() + row.durationMinutes * 60_000);

        // 6. artwork 진척 (plan §progressPercent·remainingSteps 계산 규칙 의사코드 그대로)
        const artwork = this.calcArtwork(row.status, row.artworkId, row.artworkStatus);

        // 7. delivery
        const deliveryMethod = ReservationDeliveryMethod[row.deliveryMethod];
        const delivery = this.calcDelivery(deliveryMethod, row.delivery);

        // 8. shippingAddress (legacy 호환 — Delivery.shippingAddress, PICKUP이면 null)
        const shippingAddress =
            deliveryMethod === ReservationDeliveryMethod.DELIVERY
                ? (row.delivery?.shippingAddress ?? null)
                : null;

        // 9. hasReview / reviewId
        const hasReview = row.review !== null;
        const reviewId = row.review?.id ?? null;

        return {
            reservation: {
                id: row.id,
                storeId: row.storeId,
                storeName: row.storeName,
                programId: row.programId,
                programTitle: row.programTitle,
                scheduledAt: row.scheduledAt.toISOString(),
                scheduledEndAt: scheduledEndAt.toISOString(),
                reserverName: row.reserverName,
                reserverPhone: row.reserverPhone,
                participantCount: row.participantCount,
                deliveryMethod,
                shippingAddress,
                requestMemo: row.requestMemo ?? null,
                status: row.status,
                displayState,
                artworkId: row.artworkId ?? null,
                createdAt: row.createdAt.toISOString(),
                totalPrice,
                delivery,
                canCancel,
                cancelDeadlineDays: row.cancelDeadlineDays,
                artwork,
                hasReview,
                reviewId,
            },
        };
    }

    private calcArtwork(
        status: ReservationStatus,
        artworkId: string | null,
        artworkStatus: ArtworkStatus | null,
    ): ReservationDetailArtwork | null {
        if (status !== ReservationStatus.IN_PROGRESS) return null;
        if (!artworkId || !artworkStatus) return null;

        const idx = STAGE_INDEX[artworkStatus];
        if (idx === undefined) return null; // RESERVED/VISITED/COMPLETED/CANCELED

        return {
            id: artworkId,
            progressPercent: Math.round((idx / FIRING_TOTAL) * 100),
            remainingSteps: FIRING_TOTAL - idx,
        };
    }

    private calcDelivery(
        deliveryMethod: ReservationDeliveryMethodValue,
        delivery: {
            recipientName: string | null;
            recipientPhone: string | null;
            shippingAddress: string | null;
            addressDetail: string | null;
            carrier: string | null;
            trackingNumber: string | null;
        } | null,
    ): ReservationDetailDelivery | null {
        if (deliveryMethod !== ReservationDeliveryMethod.DELIVERY) return null;
        if (!delivery) return null;

        // address 조합: [shippingAddress, addressDetail].filter(Boolean).join(' ').trim()
        // plan §OPEN-ADDR 임시 처리 (postalCode 제외)
        const address = [delivery.shippingAddress, delivery.addressDetail]
            .filter(Boolean)
            .join(' ')
            .trim();

        return {
            recipientName: delivery.recipientName ?? '',
            recipientPhone: delivery.recipientPhone ?? '',
            address,
            carrier: delivery.carrier,
            trackingNumber: delivery.trackingNumber,
        };
    }
}
