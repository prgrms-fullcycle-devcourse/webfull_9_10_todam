import { HttpStatus, Injectable } from '@nestjs/common';
import {
    ArtworkStatus,
    ReservationDeliveryMethod,
    ReservationSource,
    ReservationStatus,
} from '@prisma/client';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { calcDisplayState } from '../../domain/display-state.util';
import { KST_OFFSET_MINUTES } from '../../domain/date.util';
import { UserReservationRepository } from '../../domain/repositories/user-reservation.repository';
import type { ReservationDetailArtwork, ReservationDetailDelivery } from '@todam/shared';
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

/** Date → KST 기준 "YYYY-MM-DD" 날짜 숫자 (비교 전용) */
function toKSTDateNum(date: Date): number {
    const kst = new Date(date.getTime() + KST_OFFSET_MINUTES * 60 * 1000);
    // YYYYMMDD 정수로 만들어 대소 비교
    return kst.getUTCFullYear() * 10000 + (kst.getUTCMonth() + 1) * 100 + kst.getUTCDate();
}

/** subDateNum(base, days): base 날짜에서 days일을 뺀 날짜 숫자 반환 */
function subDaysNum(baseDateNum: number, days: number): number {
    // YYYYMMDD → Date(UTC 자정) → minus days → YYYYMMDD
    const year = Math.floor(baseDateNum / 10000);
    const month = Math.floor((baseDateNum % 10000) / 100) - 1;
    const day = baseDateNum % 100;
    const d = new Date(Date.UTC(year, month, day));
    d.setUTCDate(d.getUTCDate() - days);
    return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

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

        // 5. canCancel (plan §canCancel 계산 규칙 의사코드 그대로)
        const canCancel = this.calcCanCancel(
            row.status,
            row.source,
            row.scheduledAt,
            row.cancelDeadlineDays,
        );

        // 6. artwork 진척 (plan §progressPercent·remainingSteps 계산 규칙 의사코드 그대로)
        const artwork = this.calcArtwork(row.status, row.artworkId, row.artworkStatus);

        // 7. delivery
        const delivery = this.calcDelivery(row.deliveryMethod, row.delivery);

        // 8. shippingAddress (legacy 호환 — Delivery.shippingAddress, PICKUP이면 null)
        const shippingAddress =
            row.deliveryMethod === ReservationDeliveryMethod.DELIVERY
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
                reserverName: row.reserverName,
                reserverPhone: row.reserverPhone,
                participantCount: row.participantCount,
                deliveryMethod: row.deliveryMethod,
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

    private calcCanCancel(
        status: ReservationStatus,
        source: ReservationSource,
        scheduledAt: Date,
        cancelDeadlineDays: number | null,
    ): boolean {
        // status 전제 조건
        if (status !== ReservationStatus.PENDING && status !== ReservationStatus.CONFIRMED) {
            return false;
        }
        // source 전제 조건
        if (source !== ReservationSource.CUSTOMER) {
            return false;
        }

        const nowKST = new Date();
        const todayNum = toKSTDateNum(nowKST);
        const scheduledNum = toKSTDateNum(scheduledAt);

        // 당일 취소 불가 baseline
        if (todayNum >= scheduledNum) {
            return false;
        }

        const effectiveN = Math.max(cancelDeadlineDays ?? 1, 1);
        const deadlineNum = subDaysNum(scheduledNum, effectiveN);

        return todayNum <= deadlineNum;
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
        deliveryMethod: ReservationDeliveryMethod,
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
