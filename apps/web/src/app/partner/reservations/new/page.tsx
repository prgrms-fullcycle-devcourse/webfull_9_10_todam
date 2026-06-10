'use client';

import { useSearchParams } from 'next/navigation';

import { useCurrentStudioId } from '@/entities/studio';
import { PartnerReservationManualCreateClient } from '@/features/reservation/manual-create';

export default function PartnerReservationNewPage() {
    const searchParams = useSearchParams();
    const storeId = useCurrentStudioId();

    if (!storeId) return null;

    return (
        <PartnerReservationManualCreateClient
            storeId={storeId}
            initialDate={searchParams.get('date') ?? undefined}
        />
    );
}
