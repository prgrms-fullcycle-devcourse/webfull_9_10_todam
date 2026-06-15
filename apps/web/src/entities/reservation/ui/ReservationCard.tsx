'use client';

import Link from 'next/link';

import { formatScheduled, type ReservationListItem } from '@todam/shared';

import { ReservationStatusBadge } from './ReservationStatusBadge';

// 예약 카드(공용) — 홈 최근예약·예약 목록 공유.
// 카드 전체가 예약 상세(/my/reservations/{id}) 로 이동.
// status message frame 노출은 데이터 유무로만 판단(종료상태 숨김 규칙 없음 — BE 가 메시지 자체로 제어).
function hasStatusMessage(item: ReservationListItem): boolean {
    return Boolean(item.displayState.description.trim() || item.displayState.subLabel);
}

export function ReservationCard({ item }: { item: ReservationListItem }) {
    const { date, day, time } = formatScheduled(item.scheduledAt);
    const showMessage = hasStatusMessage(item);

    return (
        <Link
            href={`/my/reservations/${item.id}`}
            className="flex w-full flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-4 text-left"
        >
            <div className="flex flex-col gap-2">
                {/* 행 1: date·day + 우측 배지 */}
                <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center gap-1">
                        <span className="text-base font-semibold text-foreground">{date}</span>
                        <span className="text-base text-foreground-tertiary">{day}</span>
                    </div>
                    <ReservationStatusBadge status={item.status} label={item.displayState.label} />
                </div>

                {/* 행 2: programTitle + meta(storeName・hh:mm) */}
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">{item.programTitle}</p>
                    <p className="text-xs text-foreground-tertiary">
                        {item.storeName}・{time}
                    </p>
                </div>
            </div>

            {/* 행 3: status message (옵션). displayState.description·subLabel 그대로 렌더. */}
            {showMessage && (
                <div className="flex h-8 items-center rounded-lg bg-muted px-3">
                    <p className="text-xs font-semibold text-foreground-secondary">
                        {item.displayState.description}
                        {item.displayState.subLabel ? ` · ${item.displayState.subLabel}` : ''}
                    </p>
                </div>
            )}
        </Link>
    );
}
