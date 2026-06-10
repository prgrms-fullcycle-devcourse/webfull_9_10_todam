import { ArtworkStatus } from '@prisma/client';
import type { DisplayState } from '@todam/shared';

// 작품 전용 stage → displayState 매핑.
// reservation display-state.util.ts 와 별개 — VISITED/COMPLETED 문구가 다르고
// RESERVED/CANCELED 잠정값도 포함.
// SSOT: docs/exec-plans/active/유저 예약 - 작품 상세 조회.md §Reconcile D5 결정.

const ARTWORK_STAGE_DISPLAY: Record<ArtworkStatus, DisplayState> = {
    [ArtworkStatus.VISITED]: {
        label: '흙',
        description: '체험이 완료되었어요.',
        subLabel: null,
    },
    [ArtworkStatus.DRYING]: {
        label: '제작 중',
        description: '작품이 단단해지도록 정성껏 말리고 있어요.',
        subLabel: '건조',
    },
    [ArtworkStatus.BISQUE_FIRING]: {
        label: '제작 중',
        description: '가마 속에서 첫 번째로 구워지는 중이에요.',
        subLabel: '초벌',
    },
    [ArtworkStatus.GLAZING]: {
        label: '제작 중',
        description: '매끄러운 빛깔을 내기 위해 예쁘게 옷을 입혔어요.',
        subLabel: '유약',
    },
    [ArtworkStatus.GLAZE_FIRING]: {
        label: '제작 중',
        description: '가장 뜨거운 가마를 견디며 더 튼튼해지고 있어요.',
        subLabel: '재벌',
    },
    [ArtworkStatus.COMPLETED]: {
        label: '완성',
        description: '작품이 완성되었어요.',
        subLabel: null,
    },
    // D-EDGE 잠정값 — 디자인 미커버. 실제 진입 경로 없으나 안전값 제공.
    [ArtworkStatus.RESERVED]: {
        label: '예약 완료',
        description: '체험일에 공방에서 만나요!',
        subLabel: null,
    },
    [ArtworkStatus.CANCELED]: {
        label: '제작 취소',
        description: '아쉽지만 작품 제작이 취소되었어요.',
        subLabel: null,
    },
};

export function artworkStageDisplayState(status: ArtworkStatus): DisplayState {
    return ARTWORK_STAGE_DISPLAY[status];
}

// 유저 타임라인에 포함되는 고정 6단계 시퀀스. RESERVED/CANCELED 미포함.
export const ARTWORK_STAGE_SEQUENCE = [
    ArtworkStatus.VISITED,
    ArtworkStatus.DRYING,
    ArtworkStatus.BISQUE_FIRING,
    ArtworkStatus.GLAZING,
    ArtworkStatus.GLAZE_FIRING,
    ArtworkStatus.COMPLETED,
] as const;
