'use client';

import { use } from 'react';

import { StoreEditLayout } from '../../../../../../features/store/edit';

export default function PartnerStoreEditInfoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <StoreEditLayout storeId={id} section="info" />;
}
