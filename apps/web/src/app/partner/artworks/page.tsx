'use client';

import { useCurrentStudioId } from '@/entities/studio';
import { ArtworkListClient } from '@/features/artwork/list';

export default function PartnerArtworksPage() {
    const storeId = useCurrentStudioId();

    if (!storeId) return null;

    return <ArtworkListClient storeId={storeId} />;
}
