// FE 고정행 조립 유틸.
// Decision Log 2026-06-09: 상세 타임라인은 BE timeline[] 직접 렌더가 아니라 FE 고정 행 조립.
// 정본 행 = 체험 · 건조 · 초벌 · 유약 · 재벌 · (배송중|픽업가능) · (배송완료|픽업완료)
//
// 입력: GetPartnerArtworkDetailResult['artwork']
// 출력: 고정 7행 (DELIVERY/PICKUP 분기에 따라 수령 행 라벨 변경)
//
// state 매핑:
//   CURRENT|COMPLETED|UPCOMING (BE) → 'current'|'completed'|'upcoming' (FE StepperIconStatus)

import type { GetPartnerArtworkDetailResult } from '@todam/shared';
import { formatYmdWithDay } from '@todam/shared';

export type TimelineRowState = 'completed' | 'current' | 'upcoming';

export type TimelineImage = {
    src: string;
    alt: string;
};

export type TimelineRow = {
    key: string;
    label: string;
    state: TimelineRowState;
    date?: string;
    photos: TimelineImage[];
    editable: boolean;
    artworkLogId?: string | null;
};

type ArtworkInput = GetPartnerArtworkDetailResult['artwork'];

function beStateToFe(state: 'CURRENT' | 'COMPLETED' | 'UPCOMING'): TimelineRowState {
    return state.toLowerCase() as TimelineRowState;
}

function photoToImage(photo: { id: string; imageUrl: string }): TimelineImage {
    return {
        src: photo.imageUrl,
        alt: '작품 사진',
    };
}

/**
 * 파트너 작품 상세 타임라인 고정 7행(deliveryMethod 분기) 조립.
 * Decision Log 2026-06-09 매핑 규칙 준수.
 */
export function buildPartnerTimeline(artwork: ArtworkInput): TimelineRow[] {
    const {
        status,
        artworkLogId,
        logs,
        timeline,
        reservation,
        reservationStatus,
        delivery,
        deliveryMethod,
    } = artwork;

    // --- 체험 행 ---
    // DRYING+ → completed, RESERVED & scheduledAt 미래 → upcoming, scheduledAt 도달 → current
    let visitState: TimelineRowState = 'upcoming';
    if (status !== 'RESERVED' && status !== 'CANCELED') {
        // 건조 이후 단계 = 체험 완료
        visitState = 'completed';
    } else if (status === 'RESERVED') {
        const now = new Date();
        const scheduled = new Date(reservation.scheduledAt);
        visitState = scheduled <= now ? 'current' : 'upcoming';
    }

    // 작품은 VISITED 단계를 건너뛴다(체험완료 = RESERVED→DRYING 전이). 따라서 체험 행은
    // RESERVED 로그/엔트리에 매핑한다.
    // 날짜 = "체험 완료 시각" = RESERVED 에서 빠져나간 전이(fromStatus===RESERVED) 로그. 진행중이면 없음.
    const visitEntry = timeline.find((t) => t.stage === 'RESERVED');
    const visitEditable = visitState === 'completed' || visitState === 'current';
    const visitLogId = logs.find((l) => l.toStatus === 'RESERVED')?.id;
    const visitCompletedAt = logs.find((l) => l.fromStatus === 'RESERVED')?.createdAt;

    const visitRow: TimelineRow = {
        key: 'VISITED',
        label: '체험',
        state: visitState,
        date: visitCompletedAt ? formatYmdWithDay(visitCompletedAt) : undefined,
        photos: (visitEntry?.photos ?? []).map(photoToImage),
        editable: visitEditable,
        artworkLogId: visitEditable ? visitLogId : undefined,
    };

    // --- 건조/초벌/유약/재벌 행 ---
    // BE timeline[].stage에 해당 entry(state/changedAt/photos) 매핑
    const STAGE_KEYS = [
        { key: 'DRYING', label: '건조' },
        { key: 'BISQUE_FIRING', label: '초벌' },
        { key: 'GLAZING', label: '유약' },
        { key: 'GLAZE_FIRING', label: '재벌' },
    ] as const;

    const stageRows: TimelineRow[] = STAGE_KEYS.map(({ key, label }) => {
        const entry = timeline.find((t) => t.stage === key);

        if (!entry) {
            return {
                key,
                label,
                state: 'upcoming' as TimelineRowState,
                photos: [],
                editable: false,
            };
        }

        const rowState = beStateToFe(entry.state);
        // 편집 가능(첨부 노출): 현재단계 또는 완료 단계. 예정(upcoming)만 숨김.
        const editable = rowState === 'current' || rowState === 'completed';

        // 단계별 artworkLogId: logs[] 의 해당 stage 전이 로그(toStatus===stage).
        // current 는 top-level artwork.artworkLogId 로 보강.
        const stageLogId =
            logs.find((l) => l.toStatus === key)?.id ??
            (rowState === 'current' ? artworkLogId : undefined);

        // 날짜 = "완료 시각" = 이 단계에서 빠져나간 전이(fromStatus===key) 로그 시각.
        // 진행중(현재) 단계는 아직 완료 안 됐으므로 날짜 없음.
        const completedAt = logs.find((l) => l.fromStatus === key)?.createdAt;

        return {
            key,
            label,
            state: rowState,
            date: completedAt ? formatYmdWithDay(completedAt) : undefined,
            photos: entry.photos.map(photoToImage),
            editable,
            artworkLogId: editable ? stageLogId : undefined,
        };
    });

    // --- 수령 행 2개 ---
    // deliveryMethod=DELIVERY → [배송중, 배송완료]
    // deliveryMethod=PICKUP  → [픽업가능, 픽업완료]
    const deliveryRows = buildDeliveryRows({
        reservationStatus,
        delivery,
        status,
        deliveryMethod,
        pickupReadyAt: artwork.pickupReadyAt,
        pickupDoneAt: artwork.pickupDoneAt,
        deliveredAt: artwork.deliveredAt,
    });

    return [visitRow, ...stageRows, ...deliveryRows];
}

type ArtworkStatus = ArtworkInput['status'];
type DeliveryMethod = ArtworkInput['deliveryMethod'];
type Delivery = ArtworkInput['delivery'];
type ReservationStatus = ArtworkInput['reservationStatus'];

type BuildDeliveryRowsInput = {
    reservationStatus: ReservationStatus;
    delivery: Delivery;
    status: ArtworkStatus;
    deliveryMethod: DeliveryMethod;
    pickupReadyAt: string | null;
    pickupDoneAt: string | null;
    deliveredAt: string | null;
};

// 수령 행 2개 state 파생. reservation.status 기준(availableAction은 종료 시 비어 분기 불가).
//   DELIVERY: COMPLETED+IN_PROGRESS → 배송중 current / SHIPPED → 배송중 completed·배송완료 current / DELIVERED → 둘 다 completed
//   PICKUP:   COMPLETED+IN_PROGRESS → 픽업가능 current / PICKUP_READY → 픽업가능 completed·픽업완료 current / PICKUP_DONE → 둘 다 completed
// 날짜 = 전이 시각(배송중=delivery.shippedAt, 배송완료=deliveredAt, 픽업가능=pickupReadyAt, 픽업완료=pickupDoneAt).
function buildDeliveryRows({
    reservationStatus,
    delivery,
    status,
    deliveryMethod,
    pickupReadyAt,
    pickupDoneAt,
    deliveredAt,
}: BuildDeliveryRowsInput): TimelineRow[] {
    const isCompleted = status === 'COMPLETED';
    const dateOf = (iso: string | null) => (iso ? formatYmdWithDay(iso) : undefined);

    if (deliveryMethod === 'DELIVERY') {
        let shippingState: TimelineRowState = 'upcoming';
        let deliveredState: TimelineRowState = 'upcoming';

        if (reservationStatus === 'DELIVERED') {
            shippingState = 'completed';
            deliveredState = 'completed';
        } else if (reservationStatus === 'SHIPPED') {
            shippingState = 'completed';
            deliveredState = 'current';
        } else if (isCompleted) {
            // 제작 완료, 배송 전 = 배송 시작 가능 단계
            shippingState = 'current';
            deliveredState = 'upcoming';
        }

        return [
            {
                key: 'shipping',
                label: '배송 중',
                state: shippingState,
                date: dateOf(delivery?.shippedAt ?? null),
                photos: [],
                editable: false,
            },
            {
                key: 'delivered',
                label: '배송 완료',
                state: deliveredState,
                date: dateOf(deliveredAt),
                photos: [],
                editable: false,
            },
        ];
    }

    // PICKUP
    let pickupReadyState: TimelineRowState = 'upcoming';
    let pickupDoneState: TimelineRowState = 'upcoming';

    if (reservationStatus === 'PICKUP_DONE') {
        pickupReadyState = 'completed';
        pickupDoneState = 'completed';
    } else if (reservationStatus === 'PICKUP_READY') {
        pickupReadyState = 'completed';
        pickupDoneState = 'current';
    } else if (isCompleted) {
        // 제작 완료, 픽업 전 = 픽업 준비 가능 단계
        pickupReadyState = 'current';
        pickupDoneState = 'upcoming';
    }

    return [
        {
            key: 'pickup_ready',
            label: '픽업 가능',
            state: pickupReadyState,
            date: dateOf(pickupReadyAt),
            photos: [],
            editable: false,
        },
        {
            key: 'pickup_done',
            label: '픽업 완료',
            state: pickupDoneState,
            date: dateOf(pickupDoneAt),
            photos: [],
            editable: false,
        },
    ];
}
