import type { PartnerArtworkListItem, ArtworkDetailStatus } from '@todam/shared';
import { ReservationDeliveryMethod } from '@todam/shared';
import { Badge } from '@todam/ui';
import { formatScheduled } from '@todam/shared';
import { DETAIL_STATUS_LABEL, DETAIL_STATUS_BADGE_TONE } from '@/entities/artwork';

import { STEP_MAP } from '../stepMap';

export type ArtworkCardItemProps = {
    item: PartnerArtworkListItem;
    onClick: () => void;
};

export function ArtworkCardItem({ item, onClick }: ArtworkCardItemProps) {
    const { date, day } = formatScheduled(item.scheduledAt);

    const deliveryLabel =
        item.deliveryMethod === ReservationDeliveryMethod.DELIVERY ? '택배 수령' : '방문 수령';

    const extraCount = item.participantCount > 1 ? item.participantCount - 1 : null;

    const statusKey = item.detailStatus ?? item.status;
    const badgeLabel = DETAIL_STATUS_LABEL[statusKey] ?? statusKey;
    const badgeTone = DETAIL_STATUS_BADGE_TONE[statusKey] ?? 'neutral';
    const StageIcon = STEP_MAP[statusKey as ArtworkDetailStatus]?.IconComponent;

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-start gap-2 rounded-2xl border border-border-subtle bg-surface p-4 text-left transition-colors hover:bg-muted"
        >
            {/* 본문 컬럼 */}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                {/* 날짜 + 요일 (인라인) */}
                <div className="flex items-center gap-1">
                    <span className="text-base font-semibold text-foreground">{date || '-'}</span>
                    <span className="text-base text-foreground-tertiary">{day}</span>
                </div>

                {/* 클래스명 + 예약자・수령 방식 */}
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm font-semibold text-foreground">
                        {item.programTitle}
                    </span>
                    <span className="truncate text-xs text-foreground-tertiary">
                        {item.reserverName}
                        {extraCount !== null && ` 외 ${extraCount}명`}・{deliveryLabel}
                    </span>
                </div>
            </div>

            <div className="shrink-0">
                <Badge tone={badgeTone} icon={StageIcon ? <StageIcon size={12} /> : undefined}>
                    {badgeLabel}
                </Badge>
            </div>
        </button>
    );
}
