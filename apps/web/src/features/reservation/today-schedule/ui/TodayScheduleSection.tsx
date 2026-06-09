'use client';

import { getTodayDateKey } from '@todam/shared';
import { useRouter } from 'next/navigation';

import { SectionTitle } from '@todam/ui';

import { usePartnerReservationsByDate } from '@/entities/reservation';
import { ReservationManagementCardItem } from '@/features/reservation/list/ui/ReservationManagementCardItem';
import { EmptyBox } from '@/shared/ui';

export interface TodayScheduleSectionProps {
    storeId: string;
}

// 오늘의 일정 섹션 — 오늘 날짜의 예약 목록(시간순). 카드는 예약 관리 카드 재사용.
export function TodayScheduleSection({ storeId }: TodayScheduleSectionProps) {
    const router = useRouter();
    const today = getTodayDateKey();
    const { data, isLoading, isError } = usePartnerReservationsByDate(storeId, today);

    // 홈 요약은 최대 3건만. 전체는 '모두보기' → /partner/reservations.
    const reservations = (data?.reservations ?? []).slice(0, 3);

    return (
        <section className="flex flex-col gap-2 py-2">
            <SectionTitle
                title="오늘의 일정"
                size="md"
                subText="모두보기"
                onSubTextClick={() => router.push('/partner/reservations')}
            />

            {isLoading && (
                <p className="py-6 text-center text-sm text-foreground-tertiary">불러오는 중...</p>
            )}

            {isError && (
                <p className="py-6 text-center text-sm text-foreground-tertiary">
                    오늘의 일정을 불러오지 못했습니다.
                </p>
            )}

            {!isLoading && !isError && reservations.length === 0 && (
                <EmptyBox
                    description="오늘의 일정이 없습니다."
                    actionLabel="예약 등록하기"
                    action={() => router.push('/partner/reservations/new')}
                />
            )}

            {!isLoading &&
                !isError &&
                reservations.map((reservation) => (
                    <ReservationManagementCardItem
                        key={reservation.id}
                        reservation={reservation}
                        onClick={() => router.push(`/partner/reservations/${reservation.id}`)}
                    />
                ))}
        </section>
    );
}
