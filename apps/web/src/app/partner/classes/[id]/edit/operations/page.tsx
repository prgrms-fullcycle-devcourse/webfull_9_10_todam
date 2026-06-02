'use client';

import { ProgramOperationsEditScreen, useProgramEditPreload } from '@/features/program/edit';

type PageProps = { params: Promise<{ id: string }> };

export default function PartnerClassEditOperationsPage({ params }: PageProps) {
    const { programId, program, isLoading } = useProgramEditPreload(params);

    if (isLoading || !program) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <span className="text-sm text-foreground-tertiary">불러오는 중...</span>
            </div>
        );
    }

    return <ProgramOperationsEditScreen key={programId} programId={programId} program={program} />;
}
