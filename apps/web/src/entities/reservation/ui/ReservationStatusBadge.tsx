import { Badge, BoxIcon, ClockIcon, DeliveryIcon, ThreeDIcon, type BadgeTone } from '@todam/ui';
import type { ReactElement } from 'react';
import { ReservationStatus } from '@todam/shared';

// 예약 상태 → 배지 라벨/톤/아이콘 매핑.
// plan: docs/exec-plans/active/user-예약-나의 예약조회.md §Design tokens "Badge" 표.
// 디자인 확정 4건: PENDING / IN_PROGRESS / SHIPPED / DELIVERED(=PICKUP_DONE).
// 미정 4건(CONFIRMED / CANCELED / PICKUP_READY): fallback default(neutral, label="-") 임시.
//
// 라벨은 status 별 디자인 확정 라벨이지만, 정본 응답에선 displayState.label 을 별도 제공한다.
// 즉 라벨 가시 텍스트는 항상 props.label(=displayState.label)을 우선 사용하고,
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
        tone: 'neutral',
        icon: <ClockIcon />,
        fallbackLabel: '확정',
    },
    [ReservationStatus.CANCELED]: {
        tone: 'neutral',
        icon: <ClockIcon />,
        fallbackLabel: '취소',
    },
    [ReservationStatus.IN_PROGRESS]: {
        tone: 'info',
        icon: <ThreeDIcon />,
        fallbackLabel: '제작중',
    },
    [ReservationStatus.SHIPPED]: {
        tone: 'secondary',
        icon: <DeliveryIcon />,
        fallbackLabel: '배송중',
    },
    [ReservationStatus.DELIVERED]: {
        tone: 'neutral',
        icon: <BoxIcon />,
        fallbackLabel: '작품 도착',
    },
    [ReservationStatus.PICKUP_READY]: {
        tone: 'neutral',
        icon: <ClockIcon />,
        fallbackLabel: '픽업 대기',
    },
    [ReservationStatus.PICKUP_DONE]: {
        tone: 'neutral',
        icon: <BoxIcon />,
        fallbackLabel: '작품 도착',
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
