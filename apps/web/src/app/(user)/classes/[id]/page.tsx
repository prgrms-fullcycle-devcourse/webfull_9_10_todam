import type { Metadata } from 'next';

import type { ProgramDetailResult } from '@todam/shared';

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

// 로딩은 PublicClassDetailClient 내부 스켈레톤이 담당(react-query isLoading).
export default function ClassDetailPage() {
    return <PublicClassDetailClient />;
}
