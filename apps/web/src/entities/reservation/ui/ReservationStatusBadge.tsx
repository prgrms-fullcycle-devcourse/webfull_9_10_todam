import {
    Badge,
    BoxIcon,
    CheckIcon,
    ClockIcon,
    CloseIcon,
    DeliveryIcon,
    PinIcon,
    ThreeDIcon,
    type BadgeTone,
} from '@todam/ui';
import type { ReactElement } from 'react';
import { ReservationStatus } from '@todam/shared';

// 예약 상태 → 배지 라벨/톤/아이콘 매핑.
// plan: docs/exec-plans/active/user-예약-나의 예약조회.md §Design tokens "Badge" 표.
// 디자인 정본(2026-06-01 "상태 메세지" 표) 기준 8 status 전부 확정.
//
// 라벨 가시 텍스트는 정본 응답의 displayState.label 을 우선 사용한다.
// 이 매핑은 톤/아이콘 선택과 fallback 라벨에만 사용한다.
type StatusVisual = {
    tone: BadgeTone;
    icon: ReactElement<{ size?: number }>;
    fallbackLabel: string;
};

const STATUS_VISUAL: Record<ReservationStatus, StatusVisual> = {
    [ReservationStatus.PENDING]: {
        tone: 'primary',
        icon: <ClockIcon />,
        fallbackLabel: '예약신청',
    },
    [ReservationStatus.CONFIRMED]: {
        tone: 'primary',
        icon: <CheckIcon />,
        fallbackLabel: '예약확정',
    },
    [ReservationStatus.CANCELED]: {
        tone: 'neutral',
        icon: <CloseIcon />,
        fallbackLabel: '예약취소',
    },
    [ReservationStatus.IN_PROGRESS]: {
        tone: 'info',
        icon: <ThreeDIcon />,
        fallbackLabel: '제작 중',
    },
    [ReservationStatus.SHIPPED]: {
        tone: 'secondary',
        icon: <DeliveryIcon />,
        fallbackLabel: '배송 중',
    },
    [ReservationStatus.DELIVERED]: {
        tone: 'neutral',
        icon: <BoxIcon />,
        fallbackLabel: '작품 도착',
    },
    [ReservationStatus.PICKUP_READY]: {
        tone: 'secondary',
        icon: <PinIcon />,
        fallbackLabel: '픽업 가능',
    },
    [ReservationStatus.PICKUP_DONE]: {
        tone: 'neutral',
        icon: <CheckIcon />,
        fallbackLabel: '픽업 완료',
    },
};

export type ReservationStatusBadgeProps = {
    status: ReservationStatus;
    // 정본 응답의 displayState.label. 비어있으면 매핑 fallbackLabel 사용.
    label?: string;
};

export function ReservationStatusBadge({ status, label }: ReservationStatusBadgeProps) {
    const visual = STATUS_VISUAL[status];
    return (
        <Badge tone={visual.tone} icon={visual.icon} className="shrink-0">
            {label || visual.fallbackLabel}
        </Badge>
    );
}
