'use client';

import { useRouter } from 'next/navigation';

import { SectionTitle } from '@todam/ui';

import { usePartnerPendingReservations } from '@/entities/reservation';

import { PendingReservationDateCard } from './PendingReservationDateCard';

export interface PendingReservationSectionProps {
    storeId: string;
}

// 대기 중인 예약 섹션 — 확정 대기(PENDING) 예약을 날짜별로 묶어 표시.
export function PendingReservationSection({ storeId }: PendingReservationSectionProps) {
    const router = useRouter();
    const { data, isLoading, isError } = usePartnerPendingReservations(storeId);

    const dates = data?.dates ?? [];

    // 대기 예약 0건이면 섹션 자체를 숨김(시안: 대기 있을 때만 노출).
    if (!isLoading && !isError && dates.length === 0) return null;

    return (
        <section className="flex flex-col gap-2 py-2">
            <SectionTitle title="대기 중인 예약" size="md" />

            {isLoading && (
                <p className="py-6 text-center text-sm text-foreground-tertiary">불러오는 중...</p>
            )}

            {isError && (
                <p className="py-6 text-center text-sm text-foreground-tertiary">
                    대기 예약을 불러오지 못했습니다.
                </p>
            )}

            {!isLoading &&
                !isError &&
                dates.map((d) => (
                    <PendingReservationDateCard
                        key={d.date}
                        date={d.date}
                        reservationCount={d.reservationCount}
                        onClick={() => router.push(`/partner/reservations?date=${d.date}`)}
                    />
                ))}
        </section>
    );
}
