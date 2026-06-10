import type { Metadata } from 'next';

import type { StoreDetailResult } from '@todam/shared';

import { PublicStudioDetailClient } from '@/features/studio/detail';
import { serverApiFetch } from '@/shared/api/server';

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
    const { slug } = await params;
    try {
        const { store } = await serverApiFetch<StoreDetailResult>(
            `/stores/${encodeURIComponent(slug)}`,
            { next: { revalidate: 300 } },
        );
        const title = store.name;
        const description = store.description?.trim().slice(0, 120) || `${store.name} 공방 상세`;
        const image = store.images[0]?.imageUrl;
        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'website',
                images: image ? [{ url: image }] : undefined,
            },
        };
    } catch {
        return { title: '공방 상세' };
    }
}

export default function StudioDetailPage() {
    return <PublicStudioDetailClient />;
}
