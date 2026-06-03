'use client';

import { use } from 'react';

import { StoreEditLayout } from '@/features/store/edit';

// 영업 정보 수정 (운영시간/휴식시간/운영요일/편의정보)
export default function PartnerStoreEditBusinessPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    return <StoreEditLayout storeId={id} section="operating" />;
}
