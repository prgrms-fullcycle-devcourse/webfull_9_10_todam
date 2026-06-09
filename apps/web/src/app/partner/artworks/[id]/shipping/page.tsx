'use client';

import { use } from 'react';
import { PartnerDeliveryInfoClient } from '@/features/artwork/detail-partner';

type Props = {
    params: Promise<{ id: string }>;
};

export default function PartnerArtworkShippingPage({ params }: Props) {
    const { id } = use(params);
    return <PartnerDeliveryInfoClient artworkId={id} />;
}
