'use client';

import { StudioEditLayout } from '@/features/studio/edit';
import { useCurrentStudioId } from '@/entities/studio';

// 공방 기본 정보 수정. 대상 = 현재 작업 공방(currentStore).
export default function PartnerStudioEditInfoPage() {
    const storeId = useCurrentStudioId();
    if (!storeId) return null;
    return <StudioEditLayout storeId={storeId} section="info" />;
}
