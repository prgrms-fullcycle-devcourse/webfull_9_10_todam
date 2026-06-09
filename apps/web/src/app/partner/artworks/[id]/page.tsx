'use client';

import { use } from 'react';
import { PartnerArtworkDetailClient } from '@/features/artwork/detail-partner';

type Props = {
    params: Promise<{ id: string }>;
};

export default function PartnerArtworkDetailPage({ params }: Props) {
    const { id } = use(params);
    return <PartnerArtworkDetailClient artworkId={id} />;
}
