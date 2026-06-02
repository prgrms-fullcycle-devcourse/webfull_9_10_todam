import { ReservationStatus } from '../enums/reservation-status';

// 예약 상태 → 배지 표시 메타.
// 디자인 정본 "상태 메세지" 표(2026-06-01) 기준 8 status 매핑.
// FE/Storybook 외 다른 컨슈머(예: BE displayState 매퍼)도 참조 가능하도록 shared 에 둠.
// tone/iconName 은 문자열로 둬서 UI 패키지 의존을 만들지 않음 — 렌더 시점에 매핑.

/** Badge tone 식별자. @todam/ui Badge.BadgeTone 과 동일 키 집합을 가진다. */
export type ReservationStatusBadgeTone = 'primary' | 'info' | 'secondary' | 'neutral';

/** 배지 아이콘 식별자. @todam/ui 의 아이콘 컴포넌트와 매핑된다. */
export type ReservationStatusIconName =
    | 'clock'
    | 'check'
    | 'close'
    | '3d'
    | 'delivery'
    | 'box'
    | 'pin';

export type ReservationStatusVisual = {
    tone: ReservationStatusBadgeTone;
    iconName: ReservationStatusIconName;
    /** 정본 응답의 displayState.label 이 비어있을 때 사용할 fallback. */
    fallbackLabel: string;
};

export const RESERVATION_STATUS_VISUAL: Record<ReservationStatus, ReservationStatusVisual> = {
    [ReservationStatus.PENDING]: { tone: 'primary', iconName: 'clock', fallbackLabel: '예약신청' },
    [ReservationStatus.CONFIRMED]: {
        tone: 'primary',
        iconName: 'check',
        fallbackLabel: '예약확정',
    },
    [ReservationStatus.CANCELED]: { tone: 'neutral', iconName: 'close', fallbackLabel: '예약취소' },
    [ReservationStatus.IN_PROGRESS]: { tone: 'info', iconName: '3d', fallbackLabel: '제작 중' },
    [ReservationStatus.SHIPPED]: {
        tone: 'secondary',
        iconName: 'delivery',
        fallbackLabel: '배송 중',
    },
    [ReservationStatus.DELIVERED]: { tone: 'neutral', iconName: 'box', fallbackLabel: '작품 도착' },
    [ReservationStatus.PICKUP_READY]: {
        tone: 'secondary',
        iconName: 'pin',
        fallbackLabel: '픽업 가능',
    },
    [ReservationStatus.PICKUP_DONE]: {
        tone: 'neutral',
        iconName: 'check',
        fallbackLabel: '픽업 완료',
    },
};
