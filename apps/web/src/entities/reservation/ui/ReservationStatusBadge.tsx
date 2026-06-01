import {
    Badge,
    BoxIcon,
    CheckIcon,
    ClockIcon,
    CloseIcon,
    DeliveryIcon,
    PinIcon,
    ThreeDIcon,
} from '@todam/ui';
import type { ReactElement } from 'react';
import {
    RESERVATION_STATUS_VISUAL,
    ReservationStatus,
    type ReservationStatusIconName,
} from '@todam/shared';

// iconName(shared 상수) → 실제 아이콘 컴포넌트 매핑.
// 데이터(매핑 표 자체)는 packages/shared/src/constants/reservation-status-visual.ts 에서 관리.
const ICON: Record<ReservationStatusIconName, ReactElement<{ size?: number }>> = {
    clock: <ClockIcon />,
    check: <CheckIcon />,
    close: <CloseIcon />,
    '3d': <ThreeDIcon />,
    delivery: <DeliveryIcon />,
    box: <BoxIcon />,
    pin: <PinIcon />,
};

export type ReservationStatusBadgeProps = {
    status: ReservationStatus;
    // 정본 응답의 displayState.label. 비어있으면 visual.fallbackLabel 사용.
    label?: string;
};

export function ReservationStatusBadge({ status, label }: ReservationStatusBadgeProps) {
    const visual = RESERVATION_STATUS_VISUAL[status];
    return (
        <Badge tone={visual.tone} icon={ICON[visual.iconName]} className="shrink-0">
            {label || visual.fallbackLabel}
        </Badge>
    );
}
