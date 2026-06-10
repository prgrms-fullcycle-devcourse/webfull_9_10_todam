import type { Metadata } from 'next';
import { Suspense } from 'react';

import type { ProgramDetailResult } from '@todam/shared';

import { ClassDetailSkeleton } from '@/entities/program';
import { PublicClassDetailClient } from '@/features/program/detail';
import { serverApiFetch } from '@/shared/api/server';

type PageParams = {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: PageParams): Promise<Metadata> {
    const { id } = await params;
    const sp = await searchParams;
    const storeSlug =
        (typeof sp.store === 'string' && sp.store) ||
        (typeof sp.slug === 'string' && sp.slug) ||
        '';

    // 쿼리에 공방 slug 없으면 상세를 특정 못 함 → 메타 fetch 생략, 기본 타이틀.
    if (!storeSlug) return { title: '클래스 상세' };

    try {
        const { program } = await serverApiFetch<ProgramDetailResult>(
            `/stores/${encodeURIComponent(storeSlug)}/programs/${encodeURIComponent(id)}`,
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
