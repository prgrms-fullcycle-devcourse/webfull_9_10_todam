'use client';

import { useCurrentStoreId } from '@/entities/store';
import { CurrentStoreSection } from '@/features/store/switch';
import { ArtworkProgressSection } from '@/features/artwork/in-progress-summary';
import { PendingReservationSection } from '@/features/reservation/pending-summary';
import { TodayScheduleSection } from '@/features/reservation/today-schedule';

export default function PartnerHomePage() {
    // 검수중/반려 영속 분기 + 무파트너 /apply 리다이렉트는 루트 AppShell(온보딩 게이트)이 처리.
    // 이 페이지가 렌더되면 partner 는 APPROVED 상태.

    const storeId = useCurrentStoreId();

    // storeId 미확정 시 렌더 보류(AppShell bootstrap이 storeId 보장).
    if (!storeId) return null;

    return (
        <main className="flex-1 overflow-y-auto px-4 pb-6">
            <CurrentStoreSection />
            <PendingReservationSection storeId={storeId} />
            <TodayScheduleSection storeId={storeId} />
            <ArtworkProgressSection storeId={storeId} />
        </main>
    );
}
