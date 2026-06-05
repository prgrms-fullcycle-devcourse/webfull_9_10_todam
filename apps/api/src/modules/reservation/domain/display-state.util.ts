import { ReservationStatus } from '@prisma/client';

export interface DisplayState {
    label: string;
    description: string;
    subLabel: string | null;
}

/**
 * Reservation.status → 고객 노출 displayState.
 * requirements.md §1 "displayState 계산 규칙" 기준.
 * IN_PROGRESS는 Artwork.status 조합이 필요하므로 별도 처리 — 여기서는 예약 생성 시점(PENDING / CONFIRMED)만 다룬다.
 */
export function calcDisplayState(status: ReservationStatus): DisplayState {
    switch (status) {
        case ReservationStatus.PENDING:
            return {
                label: '예약신청',
                description: '작가님이 예약 내용을 확인하고 있어요.',
                subLabel: null,
            };
        case ReservationStatus.CONFIRMED:
            return {
                label: '예약확정',
                description: '예약이 확정되었어요. 체험일을 기대해 주세요!',
                subLabel: null,
            };
        case ReservationStatus.IN_PROGRESS:
            return {
                label: '제작 중',
                description: '체험이 진행 중이에요.',
                subLabel: null,
            };
        case ReservationStatus.SHIPPED:
            return {
                label: '배송 중',
                description: '작품이 배송 중이에요.',
                subLabel: null,
            };
        case ReservationStatus.DELIVERED:
            return {
                label: '배송완료',
                description: '작품이 도착했어요.',
                subLabel: null,
            };
        case ReservationStatus.PICKUP_READY:
            return {
                label: '픽업 준비',
                description: '작품을 가져가실 준비가 됐어요.',
                subLabel: null,
            };
        case ReservationStatus.PICKUP_DONE:
            return {
                label: '픽업완료',
                description: '작품을 수령하셨어요.',
                subLabel: null,
            };
        case ReservationStatus.CANCELED:
            return {
                label: '예약취소',
                description: '예약이 취소되었어요.',
                subLabel: null,
            };
        default:
            return {
                label: '알 수 없음',
                description: '',
                subLabel: null,
            };
    }
}
