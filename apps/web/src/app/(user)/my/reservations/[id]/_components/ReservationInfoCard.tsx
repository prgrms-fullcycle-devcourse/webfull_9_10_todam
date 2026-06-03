'use client';

import { CalendarIcon, ClockIcon, FlagIcon, NametagIcon, UserIcon } from '@todam/ui';
import {
    formatPrice,
    formatScheduled,
    formatYmdWithDay,
    ReservationDeliveryMethod,
    type ReservationDetail,
} from '@todam/shared';

import { ResultTable, type ResultTableRow } from '@/shared/ui';

const DELIVERY_LABEL: Record<ReservationDeliveryMethod, string> = {
    [ReservationDeliveryMethod.DELIVERY]: '택배로 받기',
    [ReservationDeliveryMethod.PICKUP]: '공방에서 찾기',
};

// 디자인 정본 — Figma `8113:1361` 클래스 정보 ResultTable. 전역 `ResultTable` 사용.
// title=programTitle, subText=storeName. 5 행: 날짜/시간/인원/결제/작품수령.
export type ReservationInfoCardProps = {
    reservation: ReservationDetail;
};

export function ReservationInfoCard({ reservation }: ReservationInfoCardProps) {
    const { time } = formatScheduled(reservation.scheduledAt);
    const dateLine = formatYmdWithDay(reservation.scheduledAt);
    const deliveryLabel = DELIVERY_LABEL[reservation.deliveryMethod];

    const rows: ResultTableRow[] = [
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
        <ResultTable
            title={reservation.programTitle}
            storeName={reservation.storeName}
            rows={rows}
        />
    );
}
