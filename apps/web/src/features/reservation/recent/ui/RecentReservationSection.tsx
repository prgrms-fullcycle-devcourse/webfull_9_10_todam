'use client';

import { ReservationCard } from '@/entities/reservation';
import { EmptyState } from '@/shared/ui';

import { useRecentReservation } from '../queries';

// 메인 화면 최근 예약 섹션
export function RecentReservationSection() {
    const state = useRecentReservation();

    if (state.kind === 'guest') return null;

    return (
        <section className="flex flex-col gap-3 py-2">
            <h2 className="text-lg font-semibold text-foreground">최근 예약</h2>

            {state.kind === 'loading' && (
                <p className="py-6 text-center text-sm text-foreground-tertiary">
                    최근 예약을 불러오는 중입니다.
                </p>
            )}

            {state.kind === 'error' && (
                <p className="py-6 text-center text-sm text-foreground-tertiary">
                    예약 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </p>
            )}

            {state.kind === 'empty' && <EmptyState message="아직 예약 내역이 없습니다." />}
            {state.kind === 'data' && <ReservationCard item={state.item} />}
        </section>
    );
}
