import type { ComponentType } from 'react';
import { SunIcon, FireIcon, WaterIcon, FireDoubleIcon } from '@todam/ui';
import { ArtworkDetailStatus, ArtworkStatusGroup } from '@todam/shared';

type SizeProps = { size?: number };

// count-by-step 응답의 steps 키 = ArtworkDetailStatus(enum)
export type StepMeta = {
    label: string;
    IconComponent?: ComponentType<SizeProps>;
};

export const STEP_MAP: Partial<Record<ArtworkDetailStatus, StepMeta>> = {
    // IN_PROGRESS 그룹
    [ArtworkDetailStatus.DRYING]: { label: '건조', IconComponent: SunIcon },
    [ArtworkDetailStatus.BISQUE_FIRING]: { label: '초벌', IconComponent: FireIcon },
    [ArtworkDetailStatus.GLAZING]: { label: '유약', IconComponent: WaterIcon },
    [ArtworkDetailStatus.GLAZE_FIRING]: { label: '재벌', IconComponent: FireDoubleIcon },
    // WAITING 그룹
    [ArtworkDetailStatus.RESERVED]: { label: '예약 확정' },
    [ArtworkDetailStatus.VISITED]: { label: '체험 완료' },
    // RECEIVING 그룹
    [ArtworkDetailStatus.DELIVERY_READY]: { label: '수령 대기' },
    [ArtworkDetailStatus.SHIPPED]: { label: '배송 중' },
    [ArtworkDetailStatus.PICKUP_READY]: { label: '픽업 가능' },
    // RECEIVED 그룹
    [ArtworkDetailStatus.DELIVERED]: { label: '배송 완료' },
    [ArtworkDetailStatus.PICKUP_DONE]: { label: '픽업 완료' },
};

// 그룹별 고정 단계(칩) 순서. 작품 없는 단계도 0으로 항상 표기한다.
export const GROUP_STEP_ORDER: Record<ArtworkStatusGroup, ArtworkDetailStatus[]> = {
    [ArtworkStatusGroup.WAITING]: [ArtworkDetailStatus.RESERVED],
    [ArtworkStatusGroup.IN_PROGRESS]: [
        ArtworkDetailStatus.DRYING,
        ArtworkDetailStatus.BISQUE_FIRING,
        ArtworkDetailStatus.GLAZING,
        ArtworkDetailStatus.GLAZE_FIRING,
    ],
    [ArtworkStatusGroup.RECEIVING]: [ArtworkDetailStatus.SHIPPED, ArtworkDetailStatus.PICKUP_READY],
    [ArtworkStatusGroup.RECEIVED]: [ArtworkDetailStatus.DELIVERED, ArtworkDetailStatus.PICKUP_DONE],
};

// 선택 그룹의 고정 단계 순서대로 칩 구성. count 는 steps 에 없으면 0. 키가 곧 detailStatus(필터값).
export function buildStepFilters(
    group: ArtworkStatusGroup,
    steps: Partial<Record<ArtworkDetailStatus, number>>,
) {
    return GROUP_STEP_ORDER[group].map((detailStatus) => {
        const meta = STEP_MAP[detailStatus];
        return {
            key: detailStatus,
            label: meta?.label ?? detailStatus,
            count: steps[detailStatus] ?? 0,
            detailStatus,
            IconComponent: meta?.IconComponent,
        };
    });
}

// ArtworkStatusGroup → 바텀시트/드롭다운 라벨.
export const GROUP_LABEL: Record<string, string> = {
    WAITING: '제작 대기',
    IN_PROGRESS: '제작 중',
    RECEIVING: '수령 대기',
    RECEIVED: '수령 완료',
};
