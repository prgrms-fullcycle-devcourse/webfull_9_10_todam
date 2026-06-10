'use client';

import { StudioEditLayout } from '@/features/studio/edit';
import { useCurrentStudioId } from '@/entities/studio';

// 영업 정보 수정 (운영시간/휴식시간/운영요일/편의정보). 대상 = 현재 작업 공방(currentStore).
export default function PartnerStudioEditBusinessPage() {
    const storeId = useCurrentStudioId();
    if (!storeId) return null;
    return <StudioEditLayout storeId={storeId} section="operating" />;
}
