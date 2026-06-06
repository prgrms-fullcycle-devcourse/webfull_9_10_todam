'use client';

import { StoreEditLayout } from '@/features/store/edit';
import { useCurrentStoreId } from '@/entities/store';

// 예약 설정 수정. 대상 = 현재 작업 공방(currentStore).
export default function PartnerStudioEditReservationPage() {
    const storeId = useCurrentStoreId();
    if (!storeId) return null;
    return <StoreEditLayout storeId={storeId} section="reservation" />;
}
