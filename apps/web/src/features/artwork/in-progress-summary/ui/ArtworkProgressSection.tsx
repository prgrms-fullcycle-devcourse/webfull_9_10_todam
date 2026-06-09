'use client';

import { ArtworkStatusGroup } from '@todam/shared';
import { SectionTitle } from '@todam/ui';
import { useRouter } from 'next/navigation';

import { usePartnerArtworkCount } from '@/features/artwork/list/queries';
import { buildStepFilters } from '@/features/artwork/list/stepMap';

export interface ArtworkProgressSectionProps {
    storeId: string;
}

// 제작 중인 작품 섹션 — IN_PROGRESS 그룹의 단계별(건조/초벌/유약/재벌) 개수 요약.
export function ArtworkProgressSection({ storeId }: ArtworkProgressSectionProps) {
    const router = useRouter();
    const { data } = usePartnerArtworkCount({ storeId, group: ArtworkStatusGroup.IN_PROGRESS });

    // 단계 칩은 작품 없어도 0으로 항상 노출(stepMap.GROUP_STEP_ORDER 기준).
    const steps = buildStepFilters(ArtworkStatusGroup.IN_PROGRESS, data?.steps ?? {});

    return (
        <section className="flex flex-col gap-2 py-2">
            <SectionTitle
                title="제작 중인 작품"
                size="md"
                subText="자세히 보기"
                onSubTextClick={() => router.push('/partner/artworks')}
            />

            <div className="flex items-center rounded-xl bg-surface">
                {steps.map((step) => (
                    <div key={step.key} className="flex flex-1 flex-col items-center gap-0 py-2">
                        <span className="text-2xl font-bold leading-8 text-foreground">
                            {step.count}
                        </span>
                        <span className="text-xs font-normal leading-4 text-foreground-tertiary">
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}
