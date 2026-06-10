'use client';

import { StudioEditLayout } from '@/features/studio/edit';
import { useCurrentStudioId } from '@/entities/studio';

// 예약 설정 수정. 대상 = 현재 작업 공방(currentStore).
export default function PartnerStudioEditReservationPage() {
    const storeId = useCurrentStudioId();
    if (!storeId) return null;
    return <StudioEditLayout storeId={storeId} section="reservation" />;
}
