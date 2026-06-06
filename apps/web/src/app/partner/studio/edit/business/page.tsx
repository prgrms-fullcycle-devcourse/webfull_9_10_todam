'use client';

import { StoreEditLayout } from '@/features/store/edit';
import { useCurrentStoreId } from '@/entities/store';

// 영업 정보 수정 (운영시간/휴식시간/운영요일/편의정보). 대상 = 현재 작업 공방(currentStore).
export default function PartnerStudioEditBusinessPage() {
    const storeId = useCurrentStoreId();
    if (!storeId) return null;
    return <StoreEditLayout storeId={storeId} section="operating" />;
}
