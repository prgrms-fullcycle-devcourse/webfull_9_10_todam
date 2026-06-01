import { Badge, type BadgeTone } from '@todam/ui';
import { StoreStatus } from '@todam/shared';

// 게시상태 → 라벨/톤 매핑.
// 디자인 확정: PUBLISHED(게시중·초록) / PENDING(심사중·회색) / SUSPENDED(게시중단·빨강).
// DRAFT·REJECTED 는 디자인 미제공 → 잠정 매핑(추후 확정 필요).
const STATUS_BADGE: Record<StoreStatus, { label: string; tone: BadgeTone }> = {
    [StoreStatus.DRAFT]: { label: '작성 중', tone: 'neutral' },
    [StoreStatus.PENDING]: { label: '심사 중', tone: 'neutral' },
    [StoreStatus.PUBLISHED]: { label: '게시 중', tone: 'success' },
    [StoreStatus.REJECTED]: { label: '반려', tone: 'danger' },
    [StoreStatus.SUSPENDED]: { label: '게시 중단', tone: 'danger' },
};

// dot 색상은 Badge 텍스트 색(currentColor)을 그대로 따른다 — 톤별 dot 색 = 텍스트 색.
function Dot({ size = 12 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden>
            <circle cx="6" cy="6" r="3" fill="currentColor" />
        </svg>
    );
}

export type StoreStatusBadgeProps = {
    status: StoreStatus;
};

export function StoreStatusBadge({ status }: StoreStatusBadgeProps) {
    const { label, tone } = STATUS_BADGE[status];
    return (
        <Badge tone={tone} icon={<Dot />}>
            {label}
        </Badge>
    );
}
