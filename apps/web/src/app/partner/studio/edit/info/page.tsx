'use client';

import { StoreEditLayout } from '@/features/store/edit';
import { useCurrentStoreId } from '@/shared/lib/useCurrentStoreId';

// 공방 기본 정보 수정. 대상 = 현재 작업 공방(currentStore).
export default function PartnerStudioEditInfoPage() {
    const storeId = useCurrentStoreId();
    if (!storeId) return null;
    return <StoreEditLayout storeId={storeId} section="info" />;
}
