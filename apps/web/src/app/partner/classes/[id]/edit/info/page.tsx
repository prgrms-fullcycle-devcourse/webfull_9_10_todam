'use client';

import {
    ProgramInfoEditScreen,
    useProgramEditPreload,
} from '../../../../../../features/program/edit';

type PageProps = { params: Promise<{ id: string }> };

export default function PartnerClassEditInfoPage({ params }: PageProps) {
    const { programId, program, isLoading } = useProgramEditPreload(params);

    if (isLoading || !program) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <span className="text-sm text-foreground-tertiary">불러오는 중...</span>
            </div>
        );
    }

    // program 로드 완료 후 key 리마운트 → 폼 초기값을 동기적으로 구성 (effect 불필요).
    return <ProgramInfoEditScreen key={programId} programId={programId} program={program} />;
}
