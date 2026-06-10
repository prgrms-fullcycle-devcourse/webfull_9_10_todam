import type { Metadata } from 'next';
import { Suspense } from 'react';

import type { ProgramDetailResult } from '@todam/shared';

import { ClassDetailSkeleton } from '@/entities/program';
import { PublicClassDetailClient } from '@/features/program/detail';
import { serverApiFetch } from '@/shared/api/server';

type PageParams = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
    const { id } = await params;

    try {
        const { program } = await serverApiFetch<ProgramDetailResult>(
            `/programs/${encodeURIComponent(id)}`,
            { next: { revalidate: 300 } },
        );
        const title = program.title;
        const description =
            program.description?.trim().slice(0, 120) || `${program.title} 클래스 상세`;
        const image = program.images[0]?.imageUrl;
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
        return { title: '클래스 상세' };
    }
}

export default function ClassDetailPage() {
    return (
        <Suspense fallback={<ClassDetailSkeleton />}>
            <PublicClassDetailClient />
        </Suspense>
    );
}
