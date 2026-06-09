import type { BadgeTone } from '@todam/ui';

// 작품 세부 상태(ArtworkDetailStatus / ArtworkStatus) → 화면 라벨/뱃지 톤.
// 작품 목록·상세·수령 등 web 전반에서 공유하는 presentation 매핑.

export const DETAIL_STATUS_LABEL: Record<string, string> = {
    RESERVED: '예약 확정',
    VISITED: '체험 완료',
    DRYING: '건조',
    BISQUE_FIRING: '초벌',
    GLAZING: '유약',
    GLAZE_FIRING: '재벌',
    DELIVERY_READY: '수령 대기',
    SHIPPED: '배송 중',
    PICKUP_READY: '픽업 가능',
    DELIVERED: '배송 완료',
    PICKUP_DONE: '픽업 완료',
};

export const DETAIL_STATUS_BADGE_TONE: Record<string, BadgeTone> = {
    RESERVED: 'neutral',
    VISITED: 'neutral',
    DRYING: 'info',
    BISQUE_FIRING: 'primary',
    GLAZING: 'secondary',
    GLAZE_FIRING: 'primary',
    DELIVERY_READY: 'neutral',
    SHIPPED: 'info',
    PICKUP_READY: 'success',
    DELIVERED: 'success',
    PICKUP_DONE: 'success',
};
