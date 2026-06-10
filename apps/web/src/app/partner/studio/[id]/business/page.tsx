'use client';

import { use } from 'react';

import { BusinessInfoEditScreen } from '@/features/studio/business-edit';

export default function PartnerStoreBusinessEditPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    return <BusinessInfoEditScreen storeId={id} />;
}
