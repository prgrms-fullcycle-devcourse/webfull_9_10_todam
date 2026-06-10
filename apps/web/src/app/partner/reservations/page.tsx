'use client';

import { ReservationCalendarView } from '@/features/reservation/list/ui/ReservationCalendarView';
import { useCurrentStudioId } from '@/entities/studio';

export default function PartnerReservationsPage() {
    const storeId = useCurrentStudioId();

    // storeId 없을 때 guard는 AppShell bootstrap이 처리(공방 선택 화면 redirect).
    if (!storeId) return null;

    return <ReservationCalendarView storeId={storeId} />;
}
