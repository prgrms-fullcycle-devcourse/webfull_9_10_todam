'use client';

import { use } from 'react';

import { useSearchParams } from 'next/navigation';

import { ProgramOperationsEditScreen, useProgramEditPreload } from '@/features/program/edit';

type PageProps = { params: Promise<{ id: string }> };

export default function PartnerClassEditOperationsPage({ params }: PageProps) {
    const { id } = use(params);
    const storeId = useSearchParams().get('storeId') ?? '';
    const { programId, program, isLoading } = useProgramEditPreload(storeId, id);

    if (isLoading || !program) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <span className="text-sm text-foreground-tertiary">불러오는 중...</span>
            </div>
        );
    }

    return <ProgramOperationsEditScreen key={programId} programId={programId} program={program} />;
}
