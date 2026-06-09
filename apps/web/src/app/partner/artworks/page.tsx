'use client';

import { useCurrentStoreId } from '@/entities/store';
import { ArtworkListClient } from '@/features/artwork/list';

export default function PartnerArtworksPage() {
    const storeId = useCurrentStoreId();

    if (!storeId) return null;

    return <ArtworkListClient storeId={storeId} />;
}
