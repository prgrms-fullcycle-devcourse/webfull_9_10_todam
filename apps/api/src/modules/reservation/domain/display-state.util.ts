import { ArtworkStatus, ReservationStatus } from '@prisma/client';

export interface DisplayState {
    label: string;
    description: string;
    subLabel: string | null;
}

/**
 * Reservation.status (+ IN_PROGRESS 구간에서 Artwork.status) → 고객 노출 displayState.
 * requirements.md §1 "displayState 계산 규칙" 기준.
 *
 * 정본 표: docs/exec-plans/active/user-예약-나의 예약조회.md §API Contract displayState 계산 규칙
 *
 * IN_PROGRESS 이외 7종: subLabel = null
 * IN_PROGRESS: label "제작 중" 고정, subLabel/description = Artwork.status 분기
 *   - DRYING | BISQUE_FIRING | GLAZING | GLAZE_FIRING → 정본 표 문구
 *   - 그 외(RESERVED/VISITED/COMPLETED 등) → 기본값(subLabel null)
 */
export function calcDisplayState(
    status: ReservationStatus,
    artworkStatus?: ArtworkStatus | null,
): DisplayState {
    if (status === ReservationStatus.IN_PROGRESS) {
        return calcInProgressDisplayState(artworkStatus ?? null);
    }

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
                description: '예약이 확정되었어요. 공방에서 곧 만나요!',
                subLabel: null,
            };
        case ReservationStatus.CANCELED:
            return {
                label: '예약취소',
                description: '아쉽지만 예약이 취소되었어요. 다음에 꼭 다시 만나요.',
                subLabel: null,
            };
        case ReservationStatus.SHIPPED:
            return {
                label: '배송 중',
                description: '소중한 작품을 꼼꼼히 포장해서 보냈어요.',
                subLabel: null,
            };
        case ReservationStatus.DELIVERED:
            return {
                label: '작품 도착',
                description: '',
                subLabel: null,
            };
        case ReservationStatus.PICKUP_READY:
            return {
                label: '픽업 가능',
                description: '작품이 완성되어 공방에서 기다리고 있어요.',
                subLabel: null,
            };
        case ReservationStatus.PICKUP_DONE:
            return {
                label: '픽업 완료',
                description: '',
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

function calcInProgressDisplayState(artworkStatus: ArtworkStatus | null): DisplayState {
    switch (artworkStatus) {
        case ArtworkStatus.DRYING:
            return {
                label: '제작 중',
                description: '작품이 단단해지도록 정성껏 말리고 있어요.',
                subLabel: '건조',
            };
        case ArtworkStatus.BISQUE_FIRING:
            return {
                label: '제작 중',
                description: '가마 속에서 첫 번째로 구워지는 중이에요.',
                subLabel: '초벌',
            };
        case ArtworkStatus.GLAZING:
            return {
                label: '제작 중',
                description: '매끄러운 빛깔을 내기 위해 예쁘게 옷을 입혔어요.',
                subLabel: '유약',
            };
        case ArtworkStatus.GLAZE_FIRING:
            return {
                label: '제작 중',
                description: '가장 뜨거운 가마를 견디며 더 튼튼해지고 있어요.',
                subLabel: '재벌',
            };
        // RESERVED / VISITED / COMPLETED 등 IN_PROGRESS 구간 진입 전후 상태 또는 null
        default:
            return {
                label: '제작 중',
                description: '작품을 정성스럽게 제작하고 있어요.',
                subLabel: null,
            };
    }
}
