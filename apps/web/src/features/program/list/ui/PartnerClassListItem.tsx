'use client';

import { ProgramStatus, formatDuration, formatPrice } from '@todam/shared';
import type { PartnerProgramListItem } from '@todam/shared';
import { useRouter } from 'next/navigation';

import { ClassItem, getDifficultyLabel } from '@/entities/program';

export function buildProgramMetaItems(program: PartnerProgramListItem): string[] {
    return [
        getDifficultyLabel(program.difficulty),
        formatDuration(program.durationMinutes),
        `작품 수령까지 평균 ${program.leadTimeDays}일`,
    ];
}

type Props = {
    program: PartnerProgramListItem;
};

// 파트너 클래스 목록 아이템
export function PartnerClassListItem({ program }: Props) {
    const router = useRouter();
    return (
        <ClassItem
            programName={program.title}
            metaItems={buildProgramMetaItems(program)}
            price={formatPrice(program.price)}
            isClosed={program.status === ProgramStatus.INACTIVE}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/partner/classes/${program.id}`)}
            className="cursor-pointer text-left"
        />
    );
}
