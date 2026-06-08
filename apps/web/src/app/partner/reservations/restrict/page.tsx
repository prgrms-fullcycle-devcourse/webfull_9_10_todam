'use client';

import { useSearchParams } from 'next/navigation';
import { getTodayDateKey } from '@todam/shared';

import { RestrictionPageClient } from '@/features/reservation/restriction/ui/RestrictionPageClient';

export default function PartnerReservationRestrictPage() {
    const searchParams = useSearchParams();
    const rawDate = searchParams.get('date');
    const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : getTodayDateKey();

    return <RestrictionPageClient date={date} />;
}
