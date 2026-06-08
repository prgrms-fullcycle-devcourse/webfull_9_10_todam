'use client';

import { useSearchParams } from 'next/navigation';

import { useCurrentStoreId } from '@/entities/store';
import { PartnerReservationManualCreateClient } from '@/features/reservation/manual-create';

export default function PartnerReservationNewPage() {
    const searchParams = useSearchParams();
    const storeId = useCurrentStoreId();

    if (!storeId) return null;

    return (
        <PartnerReservationManualCreateClient
            storeId={storeId}
            initialDate={searchParams.get('date') ?? undefined}
        />
    );
}
