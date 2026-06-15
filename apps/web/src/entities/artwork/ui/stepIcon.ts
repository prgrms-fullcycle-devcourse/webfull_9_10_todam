import type { ComponentType } from 'react';
import {
    SunIcon,
    FireIcon,
    WaterIcon,
    FireDoubleIcon,
    DeliveryIcon,
    FlagIcon,
    LeafIcon,
} from '@todam/ui';
import { ArtworkStatus } from '@todam/shared';

type StepIconComponent = ComponentType<{ size?: number }>;

// 작품 단계 → 스텝퍼 아이콘 SSOT. 파트너/유저 스텝퍼 공용.
// 키: ArtworkStatus 값(공정 단계) + 파트너 전용 배송/픽업 pseudo 단계.
// 매핑 외 단계는 getStepIcon 에서 LeafIcon 으로 폴백.
const STEP_ICON_MAP: Record<string, StepIconComponent> = {
    [ArtworkStatus.RESERVED]: LeafIcon,
    [ArtworkStatus.VISITED]: LeafIcon,
    [ArtworkStatus.DRYING]: SunIcon,
    [ArtworkStatus.BISQUE_FIRING]: FireIcon,
    [ArtworkStatus.GLAZING]: WaterIcon,
    [ArtworkStatus.GLAZE_FIRING]: FireDoubleIcon,
    [ArtworkStatus.COMPLETED]: FlagIcon,
    // 배송/픽업 단계(파트너 타임라인 전용 행 key)
    shipping: DeliveryIcon,
    delivered: FlagIcon,
    pickup_ready: DeliveryIcon,
    pickup_done: FlagIcon,
};

// 단계 key(ArtworkStatus 또는 배송 pseudo) → 아이콘. 매핑 없으면 LeafIcon.
export function getStepIcon(key: string): StepIconComponent {
    return STEP_ICON_MAP[key] ?? LeafIcon;
}
