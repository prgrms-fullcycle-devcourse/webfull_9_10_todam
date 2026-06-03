'use client';

import { CalendarIcon, ClockIcon, Divider, FlagIcon, NametagIcon, UserIcon } from '@todam/ui';
import {
    formatPrice,
    formatScheduled,
    ReservationDeliveryMethod,
    type ReservationDetail,
} from '@todam/shared';

const DELIVERY_LABEL: Record<ReservationDeliveryMethod, string> = {
    [ReservationDeliveryMethod.DELIVERY]: '택배로 받기',
    [ReservationDeliveryMethod.PICKUP]: '공방에서 찾기',
};

function formatScheduledDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const day = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()] ?? '';
    return `${yyyy}. ${mm}. ${dd} (${day})`;
}

// 디자인 정본 — Figma `8113:1361` 클래스 정보 ResultTable.
// title=programTitle, subText="storeName・location" (location 은 본 응답에 없음 — 일단 storeName 만).
// 5 행: 날짜/시간/인원/결제/작품수령.
export type ReservationInfoCardProps = {
    reservation: ReservationDetail;
};

export function ReservationInfoCard({ reservation }: ReservationInfoCardProps) {
    const { time } = formatScheduled(reservation.scheduledAt);
    const dateLine = formatScheduledDate(reservation.scheduledAt);
    const deliveryLabel = DELIVERY_LABEL[reservation.deliveryMethod];

    const rows: Array<{ icon: React.ReactNode; label: string; value: string }> = [
        { icon: <CalendarIcon size={16} />, label: '날짜', value: dateLine },
        { icon: <ClockIcon size={16} />, label: '시간', value: time },
        { icon: <UserIcon size={16} />, label: '인원', value: `${reservation.participantCount}명` },
        {
            icon: <NametagIcon size={16} />,
            label: '결제',
            value: formatPrice(reservation.totalPrice),
        },
        { icon: <FlagIcon size={16} />, label: '작품 수령', value: deliveryLabel },
    ];

    return (
        <div className="flex w-full flex-col rounded-2xl bg-surface px-4 py-2">
            <div className="flex flex-col gap-1 py-2">
                <span className="text-lg font-semibold text-foreground">
                    {reservation.programTitle}
                </span>
                <span className="text-xs text-foreground-tertiary">{reservation.storeName}</span>
            </div>

            <Divider />

            {rows.map((row, index) => (
                <div key={index} className="flex items-start gap-2 py-3">
                    <div className="flex w-16 items-center gap-1 text-sm text-foreground-tertiary">
                        {row.icon}
                        <span>{row.label}</span>
                    </div>
                    <span className="flex-1 text-right text-sm font-semibold text-foreground">
                        {row.value}
                    </span>
                </div>
            ))}
        </div>
    );
}
